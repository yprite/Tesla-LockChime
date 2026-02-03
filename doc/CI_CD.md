# CI/CD 설정 가이드

## 개요

이 프로젝트는 GitHub Actions를 사용하여 자동화된 테스트 및 배포를 수행합니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Pipeline                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PR 생성/업데이트 시 (ci.yml):                                    │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                      │
│  │Checkout │───▶│ Install │───▶│  Test   │                      │
│  └─────────┘    └─────────┘    └─────────┘                      │
│                                                                  │
│  main 브랜치 머지 시 (deploy.yml):                                │
│  ┌─────────┐    ┌─────────┐    ┌──────────────┐                 │
│  │  Test   │───▶│ Upload  │───▶│ Deploy to    │                 │
│  └─────────┘    │ Artifact│    │ GitHub Pages │                 │
│                 └─────────┘    └──────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## 워크플로우 파일

### 1. CI 워크플로우 (`ci.yml`)

**트리거:** PR 생성/업데이트, main 브랜치 푸시

**작업:**
- Node.js 20 설치
- 의존성 설치 (`npm ci`)
- Lint 실행 (`npm run lint`)
- 테스트 실행 (`npm test`)

### 2. 배포 워크플로우 (`deploy.yml`)

**트리거:** main 브랜치에 머지 시 자동 실행

**작업:**
1. 테스트 실행
2. GitHub Pages에 자동 배포

**사용 방법:**
- PR을 main 브랜치에 머지하면 자동으로 배포됩니다
- 수동 실행: Actions 탭 > "Deploy to GitHub Pages" > "Run workflow"

### 3. Firebase 배포 워크플로우 (`deploy-firebase.yml`)

**트리거:** 수동 실행만 지원

**사전 요구사항:**
1. Firebase 프로젝트 생성
2. GitHub Secrets 설정 필요

## GitHub Pages 배포 설정

### 1. Repository 설정

1. GitHub Repository > Settings > Pages
2. Source: "GitHub Actions" 선택
3. 저장

### 2. 첫 배포

main 브랜치에 코드 푸시 또는 PR 머지 시 자동 배포됩니다.

### 3. 배포 URL

배포 완료 후 URL: `https://<username>.github.io/<repository-name>/`

## Firebase 배포 설정 (선택사항)

커뮤니티 갤러리 기능을 사용하려면 Firebase 배포를 권장합니다.

### 1. Firebase 프로젝트 설정

[SETUP_GUIDE.md](./SETUP_GUIDE.md)의 Firebase 설정 섹션 참조

### 2. GitHub Secrets 설정

1. Firebase Console > 프로젝트 설정 > 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일 내용 복사

4. GitHub Repository > Settings > Secrets and variables > Actions
5. 다음 Secrets 추가:
   - `FIREBASE_SERVICE_ACCOUNT`: 서비스 계정 JSON 전체
   - `FIREBASE_PROJECT_ID`: Firebase 프로젝트 ID

### 3. 수동 배포

1. Actions 탭 > "Deploy to Firebase Hosting"
2. "Run workflow" 클릭
3. Environment 선택 (production/preview)
4. "Run workflow" 버튼 클릭

## 환경 변수

### GitHub Pages (기본값)
- 별도 설정 불필요
- HTTPS 자동 지원

### Firebase Hosting
| Secret Name | 설명 |
|-------------|------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase 서비스 계정 JSON |
| `FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |

## 배포 상태 확인

### GitHub UI
- Repository > Actions 탭에서 워크플로우 실행 상태 확인
- 각 워크플로우 클릭하여 상세 로그 확인

### 배포 뱃지

README에 추가할 수 있는 뱃지:

```markdown
![CI](https://github.com/<username>/<repo>/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/<username>/<repo>/actions/workflows/deploy.yml/badge.svg)
```

## 문제 해결

### 테스트 실패

1. Actions 탭에서 실패한 워크플로우 클릭
2. 실패한 단계의 로그 확인
3. 로컬에서 `npm test` 실행하여 재현
4. 문제 수정 후 다시 푸시

### 배포 실패

**GitHub Pages:**
- Repository Settings > Pages에서 "GitHub Actions" 선택 확인
- 워크플로우 권한 확인 (Settings > Actions > General)

**Firebase:**
- Secrets 설정 확인
- Firebase 프로젝트 ID 정확성 확인
- 서비스 계정 권한 확인

### 권한 오류

Repository Settings > Actions > General에서:
- "Allow all actions and reusable workflows" 선택
- "Read and write permissions" 선택

## 로컬 테스트

배포 전 로컬에서 확인:

```bash
# 테스트 실행
npm test

# 로컬 서버 실행
npm run dev

# http://localhost:3000 에서 확인
```
