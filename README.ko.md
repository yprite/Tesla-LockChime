# Tesla 잠금 사운드 제작기

테슬라 오너가 커스텀 잠금 소리를 만들고 USB 드라이브에 직접 저장할 수 있는 무료 웹 애플리케이션입니다.

🌐 [English Version](./README.md)

## 주요 기능

- **100% 무료** - 결제, 구독, 계정 필요 없음
- **12개 기본 사운드** - 클래식, 모던, SF 카테고리
- **오디오 업로드** - WAV, MP3, M4A, OGG 파일 지원
- **시각적 파형 에디터** - 드래그 핸들로 직관적인 트리밍
- **볼륨 조절** - 출력 볼륨 조정
- **페이드 효과** - 페이드 인/아웃 추가
- **오디오 정규화** - 볼륨 레벨 자동 최적화
- **USB 직접 저장** - File System Access API로 USB에 직접 저장
- **커뮤니티 갤러리** - 전 세계 사용자와 사운드 공유
- **PWA 지원** - 앱으로 설치, 오프라인 작동 (UI만)
- **완전한 접근성** - WCAG 2.1 준수, 키보드 네비게이션

## 커뮤니티 갤러리

전 세계 테슬라 오너들과 사운드를 공유하세요:

- **업로드** - 내가 만든 사운드를 갤러리에 공유
- **탐색** - 다른 사용자가 만든 사운드 발견
- **검색 및 필터** - 이름이나 카테고리로 검색
- **좋아요 및 다운로드** - 인기 사운드 확인
- **카테고리** - Classic, Modern, Futuristic, Custom, Funny, Musical

> 참고: 커뮤니티 갤러리는 Firebase 설정이 필요합니다. [설정 가이드](./doc/SETUP_GUIDE.md) 참조.

## 브라우저 지원

| 브라우저 | 지원 여부 |
|---------|---------|
| Chrome (데스크톱) | ✅ 지원 |
| Edge (데스크톱) | ✅ 지원 |
| Safari | ❌ 미지원 |
| Firefox | ❌ 미지원 |
| 모바일 브라우저 | ❌ 미지원 |

이 도구는 데스크톱 Chromium 기반 브라우저에서만 사용 가능한 **File System Access API**가 필요합니다.

## 테슬라 요구사항

- Boombox 기능이 있는 테슬라 차량 (외부 스피커가 있는 Model S, 3, X, Y)
- FAT32 또는 exFAT으로 포맷된 USB 드라이브
- 커스텀 잠금 사운드를 지원하는 소프트웨어 버전

## 빠른 시작

### 사용 방법

1. **웹사이트 방문** - 데스크톱 PC의 Chrome 또는 Edge에서 열기
2. **사운드 선택 또는 업로드** - 12개 기본 사운드, 커뮤니티 갤러리, 또는 직접 오디오 파일 업로드
3. **커스터마이즈** - 2-5초로 트리밍, 볼륨 조절, 페이드 추가
4. **저장 및 공유** - USB에 저장, 다운로드, 또는 커뮤니티 갤러리에 업로드
5. **테슬라에서 사용** - 화면의 안내 따르기

### 테슬라 설정 방법

1. 컴퓨터에서 USB 드라이브를 안전하게 제거
2. 테슬라의 USB 포트에 USB 드라이브 연결
3. **Toybox** → **Boombox** → **Lock Sound** → **USB** 선택

## 기술 사양

### 출력 파일

| 속성 | 값 |
|------|-----|
| 파일명 | `LockChime.wav` (정확히) |
| 포맷 | WAV (PCM) |
| 채널 | 모노 |
| 샘플레이트 | 44.1 kHz |
| 비트 뎁스 | 16-bit |
| 길이 | 2-5초 |
| 최대 파일 크기 | ~1 MB |

### 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                       웹 애플리케이션                         │
├─────────────────────────────────────────────────────────────┤
│  Web Audio API │  Canvas API   │  File System  │  Firebase  │
│  ────────────  │  ──────────   │  ───────────  │  ──────────│
│  • 합성        │  • 파형 표시   │  • USB 저장   │  • 갤러리  │
│  • 재생        │  • 트리밍 UI   │  • 저장 선택  │  • 스토리지│
│  • 처리        │  • 애니메이션  │  • 폴백 다운  │  • 좋아요  │
└─────────────────────────────────────────────────────────────┘
```

## 프로젝트 구조

```
Tesla-LockChime/
├── index.html           # SEO 및 접근성이 적용된 메인 페이지
├── manifest.json        # PWA 매니페스트
├── sw.js               # 오프라인 지원을 위한 서비스 워커
├── offline.html        # 오프라인 폴백 페이지
├── css/
│   └── styles.css      # 접근성이 적용된 반응형 스타일
├── js/
│   ├── app.js          # 메인 애플리케이션 컨트롤러
│   ├── audio-data.js   # 12개 합성 사운드 + WAV 인코더
│   ├── audio-processor.js  # 재생, 트리밍, 효과
│   ├── file-system.js  # File System Access API
│   ├── gallery.js      # 커뮤니티 갤러리 (Firebase)
│   └── waveform.js     # 캔버스 파형 시각화
├── src/                # 테스트용 ES 모듈
├── tests/              # Vitest 단위 테스트 (205개)
├── doc/                # 문서
│   └── SETUP_GUIDE.md  # Firebase 설정 가이드
├── images/             # PWA 아이콘
├── README.md           # 영문 README
└── README.ko.md        # 한글 README
```

## 개발

### 사전 요구사항

- Node.js 18+
- npm

### 설정

```bash
git clone https://github.com/yprite/Tesla-LockChime.git
cd Tesla-LockChime
npm install
```

### 명령어

```bash
npm test          # 모든 테스트 실행
npm run test:watch  # 감시 모드
npm run dev       # 로컬 서버 시작 (포트 3000)
```

### 테스트

프로젝트는 포괄적인 단위 테스트를 갖추고 있습니다:

```
✓ tests/audio-data.test.js (26개 테스트)
✓ tests/audio-processor.test.js (56개 테스트)
✓ tests/file-system.test.js (30개 테스트)
✓ tests/gallery.test.js (54개 테스트)
✓ tests/waveform.test.js (39개 테스트)
─────────────────────────────────────
총: 205개 테스트 통과
```

## 배포

### 정적 호스팅 (갤러리 없이)

어떤 정적 호스팅 서비스에도 배포 가능:

- **Vercel**: `vercel deploy`
- **Netlify**: GitHub 저장소 연결
- **GitHub Pages**: 저장소 설정에서 활성화
- **Cloudflare Pages**: GitHub 저장소 연결

### 커뮤니티 갤러리 포함

커뮤니티 갤러리 기능을 활성화하려면:

1. Firebase 프로젝트 생성
2. Firestore 및 Storage 설정
3. `js/gallery.js`에 Firebase 설정 업데이트
4. Firebase Hosting (권장) 또는 다른 플랫폼에 배포

자세한 내용은 [설정 가이드](./doc/SETUP_GUIDE.md) 참조.

**요구사항:**
- HTTPS (File System Access API에 필요)
- Firebase 프로젝트 (갤러리 기능용)

### 설정

1. **Firebase**: [설정 가이드](./doc/SETUP_GUIDE.md) 따르기
2. **Analytics**: `index.html`의 `G-XXXXXXXXXX`를 GA4 ID로 교체
3. **AdSense**: `index.html`에서 AdSense 코드 주석 해제 및 추가
4. **도메인**: `index.html`에서 canonical URL 및 OG 태그 업데이트

### 성능

사이트는 성능에 최적화되어 있습니다:
- 최소한의 외부 의존성
- 서비스 워커 캐싱
- 최소한의 CSS (~20KB)
- 합성된 오디오 (오디오 파일 다운로드 없음)

## 수익화

디스플레이 광고만 (비침해적):

- 헤더 광고 슬롯 (728x90 리더보드)
- 푸터 광고 슬롯 (728x90 리더보드)
- 팝업이나 전면 광고 없음
- Google AdSense 준비됨

## 접근성

WCAG 2.1 Level AA 준수:

- 본문으로 건너뛰기 링크
- 완전한 키보드 네비게이션
- 스크린 리더 지원 (ARIA)
- 포커스 인디케이터
- 고대비 모드 지원
- 움직임 감소 지원
- 시맨틱 HTML 구조

## 보안

- 사용자 인증 불필요
- 갤러리용 익명 사용자 ID (localStorage)
- 민감한 데이터 수집 없음
- Content Security Policy 준비됨
- 모든 오디오 처리는 클라이언트 측

## 라이선스

MIT 라이선스 - 자유롭게 사용, 수정, 배포하세요.

## 면책조항

이 도구는 Tesla, Inc.와 관련이 없으며, 승인 또는 후원을 받지 않았습니다. Tesla와 Tesla 로고는 Tesla, Inc.의 상표입니다.

## 기여

기여를 환영합니다! 다음 절차를 따라주세요:

1. 저장소 포크
2. 기능 브랜치 생성
3. 새 기능에 대한 테스트 작성
4. Pull Request 제출

### 완료된 기능

- [x] 12개 합성 사운드
- [x] 사용자 업로드 오디오 파일 (WAV, MP3, M4A, OGG)
- [x] 볼륨 조절
- [x] 페이드 인/아웃 효과
- [x] 오디오 정규화
- [x] 커뮤니티 사운드 갤러리
- [x] 검색, 필터 기능
- [x] 좋아요 및 다운로드 추적
- [x] 오프라인 지원 PWA
- [x] 완전한 접근성
- [x] SEO 최적화
- [x] Analytics 통합
- [x] AdSense 통합

### 향후 개선 사항

- [ ] 더 많은 사운드 효과
- [ ] 다국어 지원 (i18n)
- [ ] 사용자 프로필 및 인증
- [ ] 사운드 리믹스/매시업 기능
- [ ] 실행 취소/다시 실행
- [ ] 모바일-PC 전송을 위한 QR 코드 공유
