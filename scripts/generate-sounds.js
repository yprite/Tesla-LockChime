import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { writeFile, appendFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { selectBatchPrompts, PROMPT_TEMPLATES } from './sound-prompts.js';
import { convertToTeslaWav, validateWav } from './wav-converter.js';

const FIREBASE_CONFIG = {
  storageBucket: 'tesla-lock-sounds.firebasestorage.app'
};
const GALLERY_COLLECTION = 'sounds';
const STORAGE_PATH = 'sounds';
const CREATOR_ID = 'ai_generator';
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const RETRY_MULTIPLIER = 3;
const CREDITS_PER_SECOND = 20;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/sound-generation';

function readConfig() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is required');
  }

  const serviceAccountJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_TESLA_LOCK_SOUNDS ||
    process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_TESLA_LOCK_SOUNDS (or FIREBASE_SERVICE_ACCOUNT) environment variable is required'
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_TESLA_LOCK_SOUNDS (or FIREBASE_SERVICE_ACCOUNT) contains invalid JSON'
    );
  }

  return {
    apiKey,
    serviceAccount,
    firebaseProjectId: serviceAccount.project_id || 'unknown',
    firebaseClientEmail: serviceAccount.client_email || 'unknown',
    batchSize: parseInt(process.env.BATCH_SIZE || '5', 10),
    dryRun: process.env.DRY_RUN === 'true',
    maxDailyCredits: parseInt(process.env.MAX_DAILY_CREDITS || '500', 10)
  };
}

function initFirebase(serviceAccount) {
  const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: FIREBASE_CONFIG.storageBucket
  });

  return {
    db: getFirestore(app),
    bucket: getStorage(app).bucket()
  };
}

async function getExistingPromptIds(db) {
  const snapshot = await db.collection(GALLERY_COLLECTION)
    .where('creatorId', '==', CREATOR_ID)
    .select('promptId')
    .get();

  return snapshot.docs
    .map(doc => doc.data().promptId)
    .filter(Boolean);
}

function generateSoundId() {
  const timestamp = Date.now();
  const random = randomUUID().slice(0, 8);
  return `sound_${timestamp}_${random}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRetryDelay(attempt) {
  return RETRY_BASE_MS * Math.pow(RETRY_MULTIPLIER, attempt);
}

function isRetryableError(error) {
  if (!error) {
    return false;
  }
  const status = error.status || error.statusCode;
  if (status === 429 || status >= 500) {
    return true;
  }
  const code = error.code || '';
  return ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'UND_ERR_CONNECT_TIMEOUT']
    .includes(code);
}

function isPermissionDeniedError(error) {
  if (!error) {
    return false;
  }
  if (error.code === 7 || error.status === 403) {
    return true;
  }
  const message = String(error.message || '');
  return message.includes('PERMISSION_DENIED') || message.includes('Missing or insufficient permissions');
}

async function callElevenLabsApi(prompt, apiKey) {
  const response = await fetch(ELEVENLABS_API_URL, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: prompt.prompt,
      duration_seconds: prompt.duration,
      prompt_influence: 0.3
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown');
    const error = new Error(
      `ElevenLabs API error: ${response.status} ${response.statusText} - ${errorBody}`
    );
    error.status = response.status;
    throw error;
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToFirebase(wavResult, prompt, soundId, bucket, db) {
  const fileName = `${soundId}.wav`;
  const storagePath = `${STORAGE_PATH}/${fileName}`;

  const file = bucket.file(storagePath);
  await file.save(wavResult.wavBuffer, {
    metadata: {
      contentType: 'audio/wav',
      metadata: {
        originalName: prompt.name
      }
    }
  });

  await file.makePublic();
  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

  const soundDoc = {
    id: soundId,
    name: prompt.name,
    description: prompt.description,
    category: prompt.category,
    duration: wavResult.duration,
    fileSize: wavResult.fileSize,
    downloadUrl,
    fileName,
    likes: 0,
    downloads: 0,
    createdAt: new Date(),
    creatorId: CREATOR_ID,
    promptId: prompt.id
  };

  await db.collection(GALLERY_COLLECTION).doc(soundId).set(soundDoc);

  return { soundId, downloadUrl };
}

async function generateSingleSound(prompt, config, bucket, db) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const mp3Buffer = await callElevenLabsApi(prompt, config.apiKey);
      const wavResult = await convertToTeslaWav(mp3Buffer);
      const validation = validateWav(wavResult);

      if (!validation.valid) {
        return {
          status: 'validation_failed',
          promptId: prompt.id,
          name: prompt.name,
          errors: validation.errors,
          attempts: attempt + 1
        };
      }

      if (config.dryRun) {
        return {
          status: 'dry_run_success',
          promptId: prompt.id,
          name: prompt.name,
          duration: wavResult.duration,
          fileSize: wavResult.fileSize,
          attempts: attempt + 1
        };
      }

      const soundId = generateSoundId();
      const uploadResult = await uploadToFirebase(
        wavResult, prompt, soundId, bucket, db
      );

      return {
        status: 'success',
        promptId: prompt.id,
        name: prompt.name,
        soundId: uploadResult.soundId,
        downloadUrl: uploadResult.downloadUrl,
        duration: wavResult.duration,
        fileSize: wavResult.fileSize,
        attempts: attempt + 1
      };
    } catch (error) {
      const retryable = isRetryableError(error);
      if (retryable && attempt < MAX_RETRIES - 1) {
        const delay = getRetryDelay(attempt);
        console.error(
          `[Retry ${attempt + 1}/${MAX_RETRIES}] ${prompt.id}: ${error.message}. ` +
          `Waiting ${delay}ms...`
        );
        await sleep(delay);
        continue;
      }

      return {
        status: 'failed',
        promptId: prompt.id,
        name: prompt.name,
        error: error.message,
        errorCode: error.status || error.code || 'unknown',
        attempts: attempt + 1
      };
    }
  }

  return {
    status: 'failed',
    promptId: prompt.id,
    name: prompt.name,
    error: 'Max retries exceeded',
    errorCode: 'max_retries',
    attempts: MAX_RETRIES
  };
}

function estimateCredits(prompts) {
  const totalDuration = prompts.reduce((sum, p) => sum + p.duration, 0);
  return totalDuration * CREDITS_PER_SECOND;
}

async function writeSummary(results, config) {
  const succeeded = results.filter(r => r.status === 'success');
  const dryRun = results.filter(r => r.status === 'dry_run_success');
  const failed = results.filter(r => r.status === 'failed');
  const validationFailed = results.filter(r => r.status === 'validation_failed');
  const skipped = results.filter(r => r.status === 'skipped');

  const summary = {
    timestamp: new Date().toISOString(),
    config: {
      batchSize: config.batchSize,
      dryRun: config.dryRun
    },
    totals: {
      attempted: results.length,
      succeeded: succeeded.length + dryRun.length,
      failed: failed.length,
      validationFailed: validationFailed.length,
      skipped: skipped.length
    },
    results
  };

  await writeFile('generation-log.json', JSON.stringify(summary, null, 2));

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const md = [
      '## AI Sound Generation Report',
      '',
      `**Date:** ${summary.timestamp}`,
      `**Batch Size:** ${config.batchSize} | **Dry Run:** ${config.dryRun}`,
      '',
      '### Results',
      '',
      `| Status | Count |`,
      `|--------|-------|`,
      `| Succeeded | ${succeeded.length + dryRun.length} |`,
      `| Failed | ${failed.length} |`,
      `| Validation Failed | ${validationFailed.length} |`,
      `| Skipped (duplicate) | ${skipped.length} |`,
      `| **Total** | **${results.length}** |`,
      ''
    ];

    if (succeeded.length > 0) {
      md.push('### Generated Sounds', '');
      for (const r of succeeded) {
        md.push(`- **${r.name}** (${r.promptId}) - ${r.duration?.toFixed(1)}s, ${r.fileSize} bytes`);
      }
      md.push('');
    }

    if (failed.length > 0) {
      md.push('### Failures', '');
      for (const r of failed) {
        md.push(`- **${r.name}** (${r.promptId}): ${r.error}`);
      }
      md.push('');
    }

    await appendFile(summaryPath, md.join('\n'));
  }

  return summary;
}

async function generateBatch() {
  console.info('=== AI Sound Generation Batch ===');

  const config = readConfig();
  console.info(`Batch size: ${config.batchSize}, Dry run: ${config.dryRun}`);
  console.info(`Firebase project: ${config.firebaseProjectId}`);
  console.info(`Service account: ${config.firebaseClientEmail}`);

  const { db, bucket } = initFirebase(config.serviceAccount);

  let existingIds;
  try {
    existingIds = await getExistingPromptIds(db);
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      throw new Error(
        `Firestore access denied for ${config.firebaseClientEmail}. ` +
        'Grant IAM role "Cloud Datastore User (roles/datastore.user)" on project ' +
        `${config.firebaseProjectId}. Original error: ${error.message}`
      );
    }
    throw error;
  }
  console.info(`Found ${existingIds.length} existing AI-generated sounds`);
  console.info(`Total prompt templates available: ${PROMPT_TEMPLATES.length}`);

  const prompts = selectBatchPrompts(config.batchSize, existingIds);

  if (prompts.length === 0) {
    console.info('No new prompts available. All templates have been generated.');
    const results = [{ status: 'skipped', promptId: 'none', name: 'No prompts available' }];
    await writeSummary(results, config);
    return;
  }

  console.info(`Selected ${prompts.length} prompts for this batch`);

  const estimatedCredits = estimateCredits(prompts);
  console.info(`Estimated credits: ${estimatedCredits}`);

  if (estimatedCredits > config.maxDailyCredits) {
    throw new Error(
      `Estimated credits (${estimatedCredits}) exceed daily limit (${config.maxDailyCredits})`
    );
  }

  const results = [];
  let consecutiveRateLimits = 0;

  for (const prompt of prompts) {
    console.info(`\n--- Generating: ${prompt.name} (${prompt.id}) ---`);

    if (consecutiveRateLimits >= 3) {
      console.error('3 consecutive rate limits detected. Aborting remaining batch.');
      results.push({
        status: 'skipped',
        promptId: prompt.id,
        name: prompt.name,
        error: 'Aborted due to rate limiting'
      });
      continue;
    }

    const result = await generateSingleSound(prompt, config, bucket, db);
    results.push(result);

    if (result.errorCode === 429) {
      consecutiveRateLimits += 1;
    } else {
      consecutiveRateLimits = 0;
    }

    console.info(`Result: ${result.status}${result.error ? ` - ${result.error}` : ''}`);
  }

  const summary = await writeSummary(results, config);
  const successCount = summary.totals.succeeded;
  const failCount = summary.totals.failed + summary.totals.validationFailed;

  console.info(`\n=== Batch Complete ===`);
  console.info(`Succeeded: ${successCount}, Failed: ${failCount}`);

  if (successCount === 0 && results.length > 0) {
    throw new Error('All sounds failed to generate');
  }
}

export {
  readConfig,
  initFirebase,
  getExistingPromptIds,
  generateSoundId,
  getRetryDelay,
  isRetryableError,
  callElevenLabsApi,
  uploadToFirebase,
  generateSingleSound,
  estimateCredits,
  writeSummary,
  generateBatch,
  CREDITS_PER_SECOND
};

const currentFile = fileURLToPath(import.meta.url);
const isDirectExecution = process.argv[1] === currentFile;

if (isDirectExecution) {
  generateBatch().catch(async error => {
    console.error('Fatal error:', error.message);
    const fatalSummary = {
      timestamp: new Date().toISOString(),
      fatal: true,
      error: error.message
    };
    try {
      await writeFile('generation-log.json', JSON.stringify(fatalSummary, null, 2));
    } catch {
      // ignore file-write failure on fatal path
    }
    process.exit(1);
  });
}
