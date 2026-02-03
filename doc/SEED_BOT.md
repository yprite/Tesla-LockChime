# Gallery Seed Bot 가이드

갤러리에 초기 콘텐츠를 채워넣는 시드 봇 사용 가이드입니다.

## 개요

새로운 사용자가 갤러리를 방문했을 때 빈 갤러리 대신 다양한 사운드를 볼 수 있도록 초기 콘텐츠를 생성합니다.

## 파일 구조

```
scripts/
  └── seed-gallery.js     # Node.js 시드 스크립트
admin/
  └── seed-uploader.html  # 브라우저 기반 업로더
data/
  ├── seed-sounds.json    # 시드 데이터 (30개 사운드 정보)
  └── generated-sounds/   # 생성된 WAV 파일 (gitignore)
```

## 1. Node.js 스크립트 사용법

### 시드 데이터 생성

```bash
# 시드 데이터 JSON 파일 생성
node scripts/seed-gallery.js --create-data

# 테스트 WAV 파일도 함께 생성
node scripts/seed-gallery.js --create-data --generate-wav
```

### 생성되는 파일

- `data/seed-sounds.json`: 30개의 사운드 메타데이터
- `data/generated-sounds/`: 4종류의 테스트 WAV 파일
  - `beep.wav` - 단순 비프음
  - `chime.wav` - 화음 차임
  - `chirp.wav` - 주파수 스윕
  - `boing.wav` - 바운싱 효과

## 2. 브라우저 업로더 사용법

### 사전 준비

1. Firebase 프로젝트 설정 완료
2. Firestore 및 Storage 활성화
3. 보안 규칙 설정

### 사용 방법

1. `admin/seed-uploader.html` 파일을 브라우저에서 열기

2. Firebase 설정 수정 (파일 내 `firebaseConfig` 객체):
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

3. 옵션 설정:
   - **Generate audio programmatically**: 프로그램으로 오디오 생성
   - **Add random likes/downloads**: 랜덤 통계 추가 (갤러리가 활성화되어 보임)
   - **Stagger creation dates**: 날짜 분산 (트렌딩 섹션 작동)

4. **Start Upload** 클릭

### 업로드 옵션 설명

| 옵션 | 설명 | 권장 |
|------|------|------|
| Generate audio | WAV 파일 자동 생성 | ✅ 켜기 |
| Random stats | 좋아요/다운로드 랜덤 추가 | ✅ 켜기 |
| Stagger dates | 생성일 분산 (0~6일 전) | ✅ 켜기 |

## 3. 사운드 카테고리

| 카테고리 | 설명 | 사운드 수 |
|----------|------|-----------|
| Classic | 클래식 비프, 차임 | 5개 |
| Modern | 디지털, 테크 사운드 | 5개 |
| Futuristic | SF, 사이버펑크 | 5개 |
| Funny | 만화, 게임 효과음 | 5개 |
| Musical | 악기 사운드 | 5개 |
| Custom | 창의적 사운드 | 5개 |

## 4. 시드 사운드 목록

### Classic (5개)
- Classic Beep - 심플하고 깔끔한 비프음
- Gentle Chime - 부드러운 멜로디 차임
- Double Beep - 두 번의 빠른 비프
- Zen Bell - 평화로운 명상 벨
- Pocket Watch - 빈티지 시계 틱

### Modern (5개)
- Digital Confirmation - 현대적 디지털 사운드
- Smooth Lock - 매끄러운 잠금음
- Tech Pulse - 테슬라 오너를 위한 전자 펄스
- Stealth Mode - 조용한 확인음
- Neon Pulse - 80년대 풍 전자음

### Futuristic (5개)
- Sci-Fi Chirp - 우주선에서 나올 법한 소리
- Cyber Lock - 사이버펑크 잠금음
- Space Confirmation - 화성에서 차를 잠그는 느낌
- Robot Friend - 로봇 인사
- Electric Dreams - 신스웨이브 스타일

### Funny (5개)
- Cartoon Boing - 재미있는 바운싱 효과
- Video Game Power Up - 8비트 파워업
- Duck Quack - 오리 소리
- Arcade Classic - 향수를 불러일으키는 게임음
- Coin Drop - 동전 수집 효과음

### Musical (5개)
- Piano Note - 우아한 피아노 건반
- Guitar Strum - 빠른 기타 스트럼
- Orchestral Hit - 드라마틱한 오케스트라
- Symphony Snippet - 클래식 우아함
- Harp Gliss - 천상의 하프

### Custom (5개)
- Minimalist Click - 미니멀 클릭
- Luxury Tone - 프리미엄 톤
- Nature Whisper - 자연의 속삭임
- Bird Song - 새 지저귐
- Thunder Rumble - 드라마틱한 천둥

## 5. 프로그래밍 방식 오디오 생성

스크립트는 4가지 타입의 사운드를 프로그래밍으로 생성합니다:

### Beep (비프)
```javascript
// 단일 주파수 사인파
frequency = 880Hz
duration = 2.5s
envelope = fade in/out
```

### Chime (차임)
```javascript
// 화음 (C5, E5, G5)
frequencies = [523.25, 659.25, 783.99]
staggered delay = 0.1s
exponential decay
```

### Chirp (처프)
```javascript
// 주파수 스윕
start = 400Hz
end = 1200Hz
exponential envelope
```

### Boing (보잉)
```javascript
// 바운싱 주파수
bounce = sin(t * 15) * exp(-t * 2)
frequency = 200 + bounce * 600
```

## 6. 주의사항

1. **Firebase 설정 필수**: 업로드 전 Firebase 프로젝트 설정 완료
2. **보안 규칙**: Firestore/Storage 보안 규칙 확인
3. **중복 방지**: 같은 이름의 사운드가 이미 있는지 확인
4. **비용 고려**: Firebase Storage 사용량 모니터링

## 7. 트러블슈팅

### Firebase 연결 실패
- Firebase 설정 값 확인
- 프로젝트 ID가 정확한지 확인
- 브라우저 콘솔에서 오류 메시지 확인

### 업로드 실패
- Storage 보안 규칙 확인
- 파일 크기 제한 확인 (기본 10MB)
- 네트워크 연결 상태 확인

### 사운드가 안 들림
- 브라우저 오디오 권한 확인
- WAV 파일 형식 확인 (44100Hz, 16bit, Mono)
