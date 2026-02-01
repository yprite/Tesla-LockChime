# Tesla Lock Sound Creator - 설정 가이드

## 커뮤니티 갤러리 Firebase 설정

커뮤니티 갤러리 기능을 사용하려면 Firebase 프로젝트 설정이 필요합니다.

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `tesla-lock-sounds`)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

### 2. 웹 앱 등록

1. Firebase 콘솔에서 프로젝트 선택
2. 프로젝트 설정 (톱니바퀴 아이콘) > 일반
3. "앱 추가" > 웹 (</> 아이콘) 클릭
4. 앱 닉네임 입력 (예: `tesla-lock-web`)
5. Firebase SDK 설정 정보 복사

### 3. Firestore Database 설정

1. Firebase 콘솔 > Build > Firestore Database
2. "데이터베이스 만들기" 클릭
3. 프로덕션 모드 또는 테스트 모드 선택
4. 위치 선택 (asia-northeast3 = 서울)

**Firestore 보안 규칙 설정:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sounds/{soundId} {
      // 누구나 읽기 가능
      allow read: if true;

      // 누구나 새 사운드 업로드 가능
      allow create: if true;

      // likes, downloads 필드만 업데이트 가능
      allow update: if request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['likes', 'downloads']);
    }
  }
}
```

### 4. Storage 설정

1. Firebase 콘솔 > Build > Storage
2. "시작하기" 클릭
3. 보안 규칙 설정

**Storage 보안 규칙:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /sounds/{fileName} {
      // 누구나 읽기 가능
      allow read: if true;

      // 1MB 이하 WAV 파일만 업로드 가능
      allow write: if request.resource.size < 1 * 1024 * 1024
        && request.resource.contentType == 'audio/wav';
    }
  }
}
```

### 5. 앱에 Firebase 설정 적용

`js/gallery.js` 파일에서 `FIREBASE_CONFIG` 부분을 수정:

```javascript
const FIREBASE_CONFIG = {
    apiKey: "여기에_API_KEY_입력",
    authDomain: "프로젝트ID.firebaseapp.com",
    projectId: "프로젝트ID",
    storageBucket: "프로젝트ID.appspot.com",
    messagingSenderId: "발신자ID",
    appId: "앱ID"
};
```

Firebase 콘솔 > 프로젝트 설정 > 일반 > 내 앱 에서 설정값 확인 가능

---

## 배포 방법

### 옵션 1: Firebase Hosting (추천)

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init hosting

# 배포
firebase deploy --only hosting
```

### 옵션 2: Vercel

1. [Vercel](https://vercel.com) 가입
2. GitHub 저장소 연결
3. 자동 배포

### 옵션 3: Netlify

1. [Netlify](https://netlify.com) 가입
2. GitHub 저장소 연결
3. 빌드 설정: 없음 (정적 사이트)
4. 배포 폴더: `/` (루트)

### 옵션 4: GitHub Pages

1. 저장소 Settings > Pages
2. Source: Deploy from a branch
3. Branch: main, / (root)

---

## 체크리스트

- [ ] Firebase 프로젝트 생성
- [ ] 웹 앱 등록 및 설정값 복사
- [ ] Firestore Database 생성
- [ ] Firestore 보안 규칙 설정
- [ ] Storage 생성
- [ ] Storage 보안 규칙 설정
- [ ] `js/gallery.js`에 Firebase 설정값 적용
- [ ] 배포 플랫폼 선택 및 배포

---

## 문제 해결

### 갤러리가 로드되지 않음
- Firebase 설정값이 올바른지 확인
- 브라우저 콘솔에서 오류 메시지 확인
- Firestore/Storage 보안 규칙 확인

### 업로드 실패
- 파일 크기가 1MB 이하인지 확인
- Storage 보안 규칙에서 WAV 파일 허용 확인
- CORS 설정 확인 (필요시)

### CORS 오류 발생 시

Firebase Storage CORS 설정 파일 (`cors.json`) 생성:
```json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

적용:
```bash
gsutil cors set cors.json gs://프로젝트ID.appspot.com
```
