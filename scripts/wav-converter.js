import { execFile } from 'node:child_process';
import { writeFile, readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const TESLA_REQUIREMENTS = {
  SAMPLE_RATE: 44100,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  MIN_DURATION: 2.0,
  MAX_DURATION: 5.0,
  MAX_FILE_SIZE: 1024 * 1024
};

export { TESLA_REQUIREMENTS };

async function safeUnlink(filePath) {
  try {
    await unlink(filePath);
  } catch {
    // file may not exist, ignore
  }
}

function parseFfprobeDuration(stderr) {
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (!match) {
    return 0;
  }
  const hours = parseFloat(match[1]);
  const minutes = parseFloat(match[2]);
  const seconds = parseFloat(match[3]);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ]);
    const duration = parseFloat(stdout.trim());
    if (!Number.isNaN(duration)) {
      return duration;
    }
  } catch {
    // fallback: parse from ffprobe stderr
  }

  try {
    const { stderr } = await execFileAsync('ffprobe', [
      '-i', filePath
    ], { timeout: 10000 });
    return parseFfprobeDuration(stderr);
  } catch (error) {
    const stderr = error.stderr || '';
    return parseFfprobeDuration(stderr);
  }
}

export async function convertToTeslaWav(mp3Buffer) {
  const tempDir = tmpdir();
  const inputPath = join(tempDir, `input_${randomUUID()}.mp3`);
  const outputPath = join(tempDir, `output_${randomUUID()}.wav`);

  try {
    await writeFile(inputPath, mp3Buffer);

    await execFileAsync('ffmpeg', [
      '-i', inputPath,
      '-ar', String(TESLA_REQUIREMENTS.SAMPLE_RATE),
      '-ac', String(TESLA_REQUIREMENTS.CHANNELS),
      '-sample_fmt', 's16',
      '-t', String(TESLA_REQUIREMENTS.MAX_DURATION),
      '-y',
      outputPath
    ], { timeout: 30000 });

    const wavBuffer = await readFile(outputPath);
    const duration = await getAudioDuration(outputPath);

    return {
      wavBuffer,
      duration,
      fileSize: wavBuffer.length
    };
  } finally {
    await safeUnlink(inputPath);
    await safeUnlink(outputPath);
  }
}

export function validateWav(wavResult) {
  const errors = [];

  if (wavResult.duration < TESLA_REQUIREMENTS.MIN_DURATION) {
    errors.push(
      `Duration ${wavResult.duration.toFixed(1)}s is below minimum ${TESLA_REQUIREMENTS.MIN_DURATION}s`
    );
  }
  if (wavResult.duration > TESLA_REQUIREMENTS.MAX_DURATION) {
    errors.push(
      `Duration ${wavResult.duration.toFixed(1)}s exceeds maximum ${TESLA_REQUIREMENTS.MAX_DURATION}s`
    );
  }
  if (wavResult.fileSize > TESLA_REQUIREMENTS.MAX_FILE_SIZE) {
    errors.push(
      `File size ${wavResult.fileSize} bytes exceeds maximum ${TESLA_REQUIREMENTS.MAX_FILE_SIZE} bytes`
    );
  }
  if (wavResult.fileSize === 0) {
    errors.push('File is empty');
  }

  return { valid: errors.length === 0, errors };
}
