/**
 * Internationalization (i18n) Module
 * Supports: English, Korean, Japanese, Chinese
 */

const TRANSLATIONS = {
  en: {
    // Navigation & Tabs
    'nav.createSound': 'Create Sound',
    'nav.gallery': 'Community Gallery',
    'nav.browseGallery': 'Browse Gallery →',

    // Headers
    'header.title': 'Tesla Lock Sound Creator',
    'header.free': '100% Free',
    'header.compatibility': 'PC Only - Chrome or Edge Required',
    'header.compatibilityNote': 'This tool uses the File System Access API, which is only available in Chrome and Edge on desktop.',

    // Steps
    'step1.title': 'Select a Sound',
    'step2.title': 'Trim Your Sound',
    'step2.duration': 'Duration must be 2-5 seconds',
    'step3.title': 'Save & Share',

    // Upload
    'upload.divider': 'Or upload your own audio',
    'upload.click': 'Click to upload',
    'upload.dragDrop': 'or drag and drop',
    'upload.formats': 'WAV, MP3, M4A, OGG (max 10MB)',
    'upload.explore': 'Or explore community sounds',

    // Buttons
    'btn.preview': 'Preview',
    'btn.previewTrimmed': 'Preview Trimmed',
    'btn.stop': '⏹ Stop',
    'btn.changeSound': '← Change Sound',
    'btn.saveUsb': 'Save to USB Drive',
    'btn.download': 'Download',
    'btn.uploadGallery': 'Upload to Gallery',
    'btn.createAnother': 'Create Another Sound',
    'btn.loadMore': 'Load More',
    'btn.search': 'Search',
    'btn.cancel': 'Cancel',
    'btn.upload': 'Upload',
    'btn.copy': 'Copy',
    'btn.share': 'Share...',

    // Form Labels
    'form.start': 'Start',
    'form.end': 'End',
    'form.sec': 'sec',
    'form.duration': 'Duration',
    'form.volume': 'Volume',
    'form.fadeIn': 'Fade In',
    'form.fadeOut': 'Fade Out',
    'form.soundName': 'Sound Name *',
    'form.description': 'Description',
    'form.category': 'Category',
    'form.namePlaceholder': 'Give your sound a name',
    'form.descPlaceholder': 'Describe your sound (optional)',
    'form.searchPlaceholder': 'Search sounds...',
    'form.sortBy': 'Sort by:',
    'form.categoryFilter': 'Category:',

    // Sort Options
    'sort.newest': 'Newest',
    'sort.mostLiked': 'Most Liked',
    'sort.mostDownloaded': 'Most Downloaded',

    // Categories
    'cat.all': 'All',
    'cat.classic': 'Classic',
    'cat.modern': 'Modern',
    'cat.futuristic': 'Futuristic',
    'cat.custom': 'Custom',
    'cat.funny': 'Funny',
    'cat.musical': 'Musical',

    // Gallery
    'gallery.title': 'Community Gallery',
    'gallery.subtitle': 'Discover and share custom Tesla lock sounds with owners worldwide',
    'gallery.uploadYour': 'Upload Your Sound',
    'gallery.myUploads': 'My Uploads',
    'gallery.trending': 'Trending This Week',
    'gallery.hot': 'Hot',
    'gallery.sounds': 'Sounds',
    'gallery.downloads': 'Downloads',
    'gallery.likes': 'likes',
    'gallery.loading': 'Loading community sounds...',
    'gallery.noResults': 'No sounds found matching your search.',
    'gallery.noCategory': 'No sounds in this category yet. Be the first to share!',
    'gallery.empty': 'No community sounds yet. Be the first to share!',
    'gallery.myEmpty': "You haven't uploaded any sounds yet. Create and share your first sound!",
    'gallery.loadFailed': 'Failed to load gallery. Please try again.',

    // Status Messages
    'status.processing': 'Processing audio...',
    'status.loading': 'Loading sound...',
    'status.saving': 'Saving to USB...',
    'status.uploading': 'Uploading to gallery...',
    'status.loadingShared': 'Loading shared sound...',

    // Success Messages
    'success.title': 'Success!',
    'success.saved': 'Your custom lock sound has been saved to the USB drive.',
    'success.uploaded': 'Sound uploaded to gallery!',
    'success.loaded': 'Sound loaded from gallery!',
    'success.downloaded': 'File downloaded!',
    'success.audioUploaded': 'Audio uploaded successfully!',

    // Error Messages
    'error.fileTooLarge': 'File is too large. Maximum size is 10MB.',
    'error.invalidType': 'Invalid file type. Please upload a WAV, MP3, M4A, or OGG file.',
    'error.processAudio': 'Could not process audio file. Please try a different file.',
    'error.notFound': 'Could not find the shared sound',
    'error.downloadFailed': 'Could not download file.',
    'error.galleryUnavailable': 'Gallery is not available. Please try again later.',
    'error.playFailed': 'Could not play audio. Please check your audio settings.',
    'error.loadFailed': 'Error loading sound. Please try again.',
    'error.saveFailed': 'Could not save directly',

    // Prompts
    'prompt.downloadInstead': 'Would you like to download the file instead?',
    'prompt.createFirst': 'Create a sound first, then upload it to the gallery!',

    // Browser Compatibility
    'compat.title': 'Desktop Browser Required',
    'compat.requirement': 'This tool requires Chrome or Edge on a desktop computer.',
    'compat.explanation': 'The File System Access API needed to save files directly to USB is not available in:',
    'compat.safari': 'Safari (any platform)',
    'compat.firefox': 'Firefox (any platform)',
    'compat.mobile': 'Mobile browsers',
    'compat.tablet': 'Tablets',
    'compat.instruction': 'Please open this page in Chrome or Edge on your PC.',

    // Instructions
    'inst.usbHint': "You'll be prompted to select your USB drive. Choose the root folder of the USB drive.",
    'inst.qrHint': 'Scan to open on another device',
    'inst.howTo': 'How to use in your Tesla:',
    'inst.step1': 'Safely eject the USB drive from your computer',
    'inst.step2': "Plug the USB drive into your Tesla's USB port",
    'inst.step3': 'On the touchscreen, go to Toybox',
    'inst.step4': 'Select Boombox',
    'inst.step5': 'Tap Lock Sound',
    'inst.step6': 'Choose USB to use your custom sound',

    // Share Modal
    'share.title': 'Share Sound',
    'share.social': 'Share on Social Media',
    'share.link': 'Share Link',
    'share.qr': 'QR Code',
    'share.twitter': 'Twitter',
    'share.facebook': 'Facebook',
    'share.whatsapp': 'WhatsApp',
    'share.telegram': 'Telegram',
    'share.message': 'Check out this Tesla lock sound: "{name}" - Create your own custom lock chime!',

    // Upload Modal
    'uploadModal.title': 'Upload to Gallery',
    'uploadModal.legalNotice': 'By uploading, you confirm you own the rights to the audio or have permission to use it. Copyright-infringing content may be removed.',

    // Footer
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Use',
    'footer.disclaimer': 'This is an unofficial tool and is not affiliated with Tesla, Inc. Tesla and the Tesla logo are trademarks of Tesla, Inc.',
    'footer.copyright': '© 2024 Tesla Lock Sound Creator. Free to use. No account required.',

    // Language
    'lang.select': 'Language',
    'lang.en': 'English',
    'lang.ko': '한국어',
    'lang.ja': '日本語',
    'lang.zh': '中文',

    // Admin Dashboard
    'admin.title': 'Admin Dashboard',
    'admin.loginSubtitle': 'Sign in to manage Tesla Lock Sound Creator',
    'admin.signInGoogle': 'Sign in with Google',
    'admin.adminOnly': 'Only authorized administrators can access this page.',
    'admin.accessDenied': 'Access Denied',
    'admin.notAuthorized': 'Your account is not authorized to access the admin dashboard.',
    'admin.tryAnother': 'Try Another Account',
    'admin.logout': 'Logout',
    'admin.totalSounds': 'Total Sounds',
    'admin.totalDownloads': 'Total Downloads',
    'admin.totalLikes': 'Total Likes',
    'admin.weeklyUploads': 'This Week',
    'admin.categoryDistribution': 'Category Distribution',
    'admin.uploadTrend': 'Upload Trend (30 Days)',
    'admin.topSounds': 'Top 10 Sounds',
    'admin.soundManagement': 'Sound Management',
    'admin.searchPlaceholder': 'Search sounds...',
    'admin.sortNewest': 'Newest First',
    'admin.sortOldest': 'Oldest First',
    'admin.sortDownloads': 'Most Downloads',
    'admin.sortLikes': 'Most Likes',
    'admin.deleteSelected': 'Delete Selected',
    'admin.name': 'Name',
    'admin.category': 'Category',
    'admin.size': 'Size',
    'admin.downloads': 'Downloads',
    'admin.likes': 'Likes',
    'admin.date': 'Date',
    'admin.actions': 'Actions',
    'admin.noSounds': 'No sounds found',
    'admin.loading': 'Loading sounds...',
    'admin.prev': '← Prev',
    'admin.next': 'Next →',
    'admin.confirmDelete': 'Confirm Delete',
    'admin.deleteWarning': 'Are you sure you want to delete this sound? This action cannot be undone.',
    'admin.delete': 'Delete',
    'admin.mobileTitle': 'View Only Mode',
    'admin.mobileMessage': 'Sound deletion is only available on desktop. You can view statistics and browse sounds on mobile.',
    'admin.analyticsRange': 'Range',
    'admin.analyticsLanguage': 'Language',
    'admin.analyticsEntryChannel': 'Entry Channel',
    'admin.analyticsDevice': 'Device',
    'admin.analyticsRefresh': 'Refresh',
    'admin.range7d': 'Last 7 days',
    'admin.range14d': 'Last 14 days',
    'admin.range30d': 'Last 30 days',
    'admin.range60d': 'Last 60 days',
    'admin.deviceDesktop': 'Desktop',
    'admin.deviceMobile': 'Mobile',
    'admin.deviceTablet': 'Tablet',
    'admin.kpiMau': 'MAU (30d)',
    'admin.kpiDau': 'DAU (24h)',
    'admin.kpiActivationRate': 'Activation Rate',
    'admin.kpiD7Retention': 'D7 Retention',
    'admin.funnelConversion': 'Funnel Conversion',
    'admin.retentionTrend': 'D7 Retention Trend (14 Cohorts)',
    'admin.funnelLanding': 'Landing',
    'admin.funnelSoundOpen': 'Sound Open',
    'admin.funnelTrimComplete': 'Trim Complete',
    'admin.funnelSaveUsb': 'Save USB',
    'admin.funnelShareGallery': 'Share Gallery',
    'admin.chartUploads': 'Uploads',
    'admin.chartUsers': 'Users',
    'admin.chartD7RetentionPct': 'D7 Retention %',
    'admin.noSoundsAvailable': 'No sounds available',
    'admin.selectedCount': '{count} selected',
    'admin.pageOf': 'Page {page} of {total}',

    // V2 UI
    'v2.createFromScratch': 'Create from scratch',
    'v2.use': 'Use',
    'v2.editorTitle': 'Edit Sound',
    'v2.durationLabel': 'Duration: {duration}s',
    'v2.readyForTesla': 'Ready for Tesla (2-5 seconds)',
    'v2.tooShort': 'Too short ({duration}s) - minimum 2s',
    'v2.tooLong': 'Too long ({duration}s) - maximum 5s',
    'v2.likeFailed': 'Failed to like sound.',
    'v2.nameYourSound': 'Name your sound:',
    'v2.nameRequired': 'Please enter a name',
    'v2.uploadFailed': 'Upload failed',
    'v2.emptyTitle': 'No sounds yet',
    'v2.emptySubtitle': 'Be the first to upload a custom lock sound!',
    'v2.or': 'or',
    'v2.done': 'Done',
    'v2.ranking.item': '#{rank} {name} ({score} pts)',
    'v2.ranking.empty': 'No ranking data yet.',
    'v2.ranking.unavailable': 'Ranking unavailable right now.',
    'v2.challenge.title': 'Weekly Challenge & Ranking',
    'v2.challenge.subtitle': 'Save, upload, and share to complete this week\'s challenge.',
    'v2.challenge.saveProgress': 'Save to USB: {current}/{target} ({percent}%)',
    'v2.challenge.uploadProgress': 'Upload to Gallery: {current}/{target} ({percent}%)',
    'v2.challenge.shareProgress': 'Share to Gallery: {current}/{target} ({percent}%)',
    'v2.challenge.completed': 'Challenge complete. Weekly creator badge unlocked.',
    'v2.challenge.incomplete': 'Complete all 3 to finish this week.',
    'v2.challenge.modelLabel': 'Model Challenge',
    'v2.challenge.modelTarget': '{model} target: Save {saves}, Upload {uploads}, Share {shares}',
    'v2.signature.title': 'My Tesla Signature Pack',
    'v2.signature.subtitle': 'Set your Tesla profile and get a personalized 3-sound pack.',
    'v2.signature.nicknamePlaceholder': 'Nickname (optional)',
    'v2.signature.saveProfile': 'Save Profile',
    'v2.signature.generate': 'Generate Pack',
    'v2.signature.profileSaved': 'Profile saved.',
    'v2.signature.packTitle': '{owner} Signature Sound Pack',
    'v2.signature.apply': 'Use',
    'v2.auth.google': 'Continue with Google',
    'v2.auth.gateTitle': 'Make Your Tesla More Special',
    'v2.auth.gateSubtitle': 'Sign in to unlock My Tesla Signature Pack and Garage Badge Shelf.',
    'v2.auth.logout': 'Log out',
    'v2.auth.signedOut': 'Sign in to sync profile across devices.',
    'v2.auth.signedInAs': 'Signed in as {name}',
    'v2.auth.unavailable': 'Auth unavailable in this environment.',
    'v2.auth.loginSuccess': 'Signed in successfully.',
    'v2.auth.loginFailed': 'Could not sign in. Check OAuth provider setup.',
    'v2.auth.loggedOut': 'Logged out.',
    'v2.auth.logoutFailed': 'Could not log out.',
    'v2.badges.title': 'Garage Badge Shelf',
    'v2.badges.subtitle': 'Unlock badges by creating, saving, and sharing your signature sound.',
    'v2.badges.summary': '{unlocked}/{total} badges unlocked',
    'v2.badges.unlockedState': 'Unlocked',
    'v2.badges.lockedState': 'Locked',
    'v2.badges.unlocked': 'Badge unlocked: {badge}',
    'v2.badges.signatureStylist': 'Signature Stylist',
    'v2.badges.signatureStylistDesc': 'Generated your first signature pack',
    'v2.badges.firstLock': 'First Lock Save',
    'v2.badges.firstLockDesc': 'Saved your first lock sound to USB',
    'v2.badges.galleryRookie': 'Gallery Rookie',
    'v2.badges.galleryRookieDesc': 'Uploaded your first community sound',
    'v2.badges.modelChampion': 'Model Champion',
    'v2.badges.modelChampionDesc': 'Completed a model challenge',
    'v2.badges.communityCrafter': 'Community Crafter',
    'v2.badges.communityCrafterDesc': 'Shared 5 sounds with the community',
    'v2.badges.garageLegend': 'Garage Legend',
    'v2.badges.garageLegendDesc': 'Unlocked 5 badges',
    'v2.workspace.title': 'My Workspace',
    'v2.workspace.subtitle': 'Save drafts with version history and continue later.',
    'v2.workspace.draftPlaceholder': 'Draft name',
    'v2.workspace.saveDraft': 'Save Draft Version',
    'v2.draft.enterName': 'Enter a draft name first.',
    'v2.draft.saved': 'Draft version saved.',
    'v2.draft.empty': 'No drafts saved yet.',
    'v2.draft.load': 'Load',
    'v2.draft.delete': 'Delete',
    'v2.draft.meta': 'Versions: {versions} | Latest trim: {start}s - {end}s',
    'v2.draft.sourceMissing': 'Could not load draft source from gallery.',
    'v2.draft.loaded': 'Loaded draft: {name}',
    'v2.uploadModal.title': 'Upload Your Sound',
    'v2.uploadModal.dropText': 'Drop audio file here or browse',
    'v2.success.title': 'Sound Applied!',
    'v2.success.subtitle': 'Your custom lock sound is ready',
    'v2.success.nextSteps': 'Next Steps:',
    'v2.success.step1': 'Eject USB safely',
    'v2.success.step2': 'Plug into Tesla',
    'v2.success.step3': 'Toybox → Boombox → Lock Sound → USB',
    'v2.createModal.title': 'Create New Sound',
    'v2.createModal.subtitle': 'Choose a preset or upload your own',
    'v2.createModal.uploadOwn': 'Upload Your Own Audio',
    'v2.presetSound': 'Preset Sound',

  },

  ko: {
    // Navigation & Tabs
    'nav.createSound': '사운드 만들기',
    'nav.gallery': '커뮤니티 갤러리',
    'nav.browseGallery': '갤러리 둘러보기 →',

    // Headers
    'header.title': '테슬라 잠금 사운드 메이커',
    'header.free': '100% 무료',
    'header.compatibility': 'PC 전용 - Chrome 또는 Edge 필요',
    'header.compatibilityNote': '이 도구는 데스크톱 Chrome과 Edge에서만 지원되는 File System Access API를 사용합니다.',

    // Steps
    'step1.title': '사운드 선택',
    'step2.title': '사운드 다듬기',
    'step2.duration': '길이는 2-5초여야 합니다',
    'step3.title': '저장 및 공유',

    // Upload
    'upload.divider': '또는 직접 오디오 업로드',
    'upload.click': '클릭하여 업로드',
    'upload.dragDrop': '또는 드래그 앤 드롭',
    'upload.formats': 'WAV, MP3, M4A, OGG (최대 10MB)',
    'upload.explore': '또는 커뮤니티 사운드 탐색',

    // Buttons
    'btn.preview': '미리듣기',
    'btn.previewTrimmed': '편집본 미리듣기',
    'btn.stop': '⏹ 정지',
    'btn.changeSound': '← 사운드 변경',
    'btn.saveUsb': 'USB에 저장',
    'btn.download': '다운로드',
    'btn.uploadGallery': '갤러리에 업로드',
    'btn.createAnother': '다른 사운드 만들기',
    'btn.loadMore': '더 보기',
    'btn.search': '검색',
    'btn.cancel': '취소',
    'btn.upload': '업로드',
    'btn.copy': '복사',
    'btn.share': '공유...',

    // Form Labels
    'form.start': '시작',
    'form.end': '끝',
    'form.sec': '초',
    'form.duration': '길이',
    'form.volume': '볼륨',
    'form.fadeIn': '페이드 인',
    'form.fadeOut': '페이드 아웃',
    'form.soundName': '사운드 이름 *',
    'form.description': '설명',
    'form.category': '카테고리',
    'form.namePlaceholder': '사운드 이름을 입력하세요',
    'form.descPlaceholder': '사운드 설명 (선택사항)',
    'form.searchPlaceholder': '사운드 검색...',
    'form.sortBy': '정렬:',
    'form.categoryFilter': '카테고리:',

    // Sort Options
    'sort.newest': '최신순',
    'sort.mostLiked': '인기순',
    'sort.mostDownloaded': '다운로드순',

    // Categories
    'cat.all': '전체',
    'cat.classic': '클래식',
    'cat.modern': '모던',
    'cat.futuristic': '미래적',
    'cat.custom': '커스텀',
    'cat.funny': '재미있는',
    'cat.musical': '음악적',

    // Gallery
    'gallery.title': '커뮤니티 갤러리',
    'gallery.subtitle': '전 세계 테슬라 오너들과 커스텀 잠금 사운드를 공유하세요',
    'gallery.uploadYour': '사운드 업로드',
    'gallery.myUploads': '내 업로드',
    'gallery.trending': '이번 주 인기',
    'gallery.hot': '인기',
    'gallery.sounds': '사운드',
    'gallery.downloads': '다운로드',
    'gallery.likes': '좋아요',
    'gallery.loading': '커뮤니티 사운드 로딩 중...',
    'gallery.noResults': '검색 결과가 없습니다.',
    'gallery.noCategory': '이 카테고리에 아직 사운드가 없습니다. 첫 번째로 공유해보세요!',
    'gallery.empty': '아직 커뮤니티 사운드가 없습니다. 첫 번째로 공유해보세요!',
    'gallery.myEmpty': '아직 업로드한 사운드가 없습니다. 첫 사운드를 만들고 공유해보세요!',
    'gallery.loadFailed': '갤러리를 불러오지 못했습니다. 다시 시도해주세요.',

    // Status Messages
    'status.processing': '오디오 처리 중...',
    'status.loading': '사운드 로딩 중...',
    'status.saving': 'USB에 저장 중...',
    'status.uploading': '갤러리에 업로드 중...',
    'status.loadingShared': '공유된 사운드 로딩 중...',

    // Success Messages
    'success.title': '성공!',
    'success.saved': '커스텀 잠금 사운드가 USB 드라이브에 저장되었습니다.',
    'success.uploaded': '갤러리에 업로드되었습니다!',
    'success.loaded': '갤러리에서 사운드를 불러왔습니다!',
    'success.downloaded': '파일이 다운로드되었습니다!',
    'success.audioUploaded': '오디오가 업로드되었습니다!',

    // Error Messages
    'error.fileTooLarge': '파일이 너무 큽니다. 최대 크기는 10MB입니다.',
    'error.invalidType': '잘못된 파일 형식입니다. WAV, MP3, M4A 또는 OGG 파일을 업로드해주세요.',
    'error.processAudio': '오디오 파일을 처리할 수 없습니다. 다른 파일을 시도해주세요.',
    'error.notFound': '공유된 사운드를 찾을 수 없습니다',
    'error.downloadFailed': '파일을 다운로드할 수 없습니다.',
    'error.galleryUnavailable': '갤러리를 사용할 수 없습니다. 나중에 다시 시도해주세요.',
    'error.playFailed': '오디오를 재생할 수 없습니다. 오디오 설정을 확인해주세요.',
    'error.loadFailed': '사운드를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.',
    'error.saveFailed': '직접 저장할 수 없습니다',

    // Prompts
    'prompt.downloadInstead': '대신 파일을 다운로드하시겠습니까?',
    'prompt.createFirst': '먼저 사운드를 만든 후 갤러리에 업로드하세요!',

    // Browser Compatibility
    'compat.title': '데스크톱 브라우저 필요',
    'compat.requirement': '이 도구는 데스크톱 컴퓨터의 Chrome 또는 Edge가 필요합니다.',
    'compat.explanation': 'USB에 직접 파일을 저장하는 데 필요한 File System Access API는 다음에서 사용할 수 없습니다:',
    'compat.safari': 'Safari (모든 플랫폼)',
    'compat.firefox': 'Firefox (모든 플랫폼)',
    'compat.mobile': '모바일 브라우저',
    'compat.tablet': '태블릿',
    'compat.instruction': 'PC의 Chrome 또는 Edge에서 이 페이지를 열어주세요.',

    // Instructions
    'inst.usbHint': 'USB 드라이브를 선택하라는 메시지가 표시됩니다. USB 드라이브의 루트 폴더를 선택하세요.',
    'inst.qrHint': '다른 기기에서 열려면 스캔하세요',
    'inst.howTo': '테슬라에서 사용하는 방법:',
    'inst.step1': '컴퓨터에서 USB 드라이브를 안전하게 제거',
    'inst.step2': '테슬라의 USB 포트에 USB 드라이브 연결',
    'inst.step3': '터치스크린에서 Toybox로 이동',
    'inst.step4': 'Boombox 선택',
    'inst.step5': 'Lock Sound 탭',
    'inst.step6': 'USB를 선택하여 커스텀 사운드 사용',

    // Share Modal
    'share.title': '사운드 공유',
    'share.social': '소셜 미디어에 공유',
    'share.link': '공유 링크',
    'share.qr': 'QR 코드',
    'share.twitter': '트위터',
    'share.facebook': '페이스북',
    'share.whatsapp': '왓츠앱',
    'share.telegram': '텔레그램',
    'share.message': '이 테슬라 잠금 사운드를 확인해보세요: "{name}" - 나만의 커스텀 잠금 사운드를 만들어보세요!',

    // Upload Modal
    'uploadModal.title': '갤러리에 업로드',
    'uploadModal.legalNotice': '업로드 시 해당 음원의 권리를 보유했거나 사용 허가를 받았음을 확인한 것으로 간주됩니다. 저작권 침해 콘텐츠는 삭제될 수 있습니다.',

    // Footer
    'footer.privacy': '개인정보처리방침',
    'footer.terms': '이용약관',
    'footer.disclaimer': '이 도구는 비공식 도구이며 Tesla, Inc.와 관련이 없습니다. Tesla와 Tesla 로고는 Tesla, Inc.의 상표입니다.',
    'footer.copyright': '© 2024 Tesla Lock Sound Creator. 무료 사용. 계정 불필요.',

    // Language
    'lang.select': '언어',
    'lang.en': 'English',
    'lang.ko': '한국어',
    'lang.ja': '日本語',
    'lang.zh': '中文',

    // Admin Dashboard
    'admin.title': '관리자 대시보드',
    'admin.loginSubtitle': 'Tesla Lock Sound Creator를 관리하려면 로그인하세요',
    'admin.signInGoogle': 'Google로 로그인',
    'admin.adminOnly': '인증된 관리자만 이 페이지에 접근할 수 있습니다.',
    'admin.accessDenied': '접근 거부',
    'admin.notAuthorized': '귀하의 계정은 관리자 대시보드에 접근할 권한이 없습니다.',
    'admin.tryAnother': '다른 계정 시도',
    'admin.logout': '로그아웃',
    'admin.totalSounds': '전체 사운드',
    'admin.totalDownloads': '전체 다운로드',
    'admin.totalLikes': '전체 좋아요',
    'admin.weeklyUploads': '이번 주',
    'admin.categoryDistribution': '카테고리 분포',
    'admin.uploadTrend': '업로드 추이 (30일)',
    'admin.topSounds': '인기 사운드 Top 10',
    'admin.soundManagement': '사운드 관리',
    'admin.searchPlaceholder': '사운드 검색...',
    'admin.sortNewest': '최신순',
    'admin.sortOldest': '오래된순',
    'admin.sortDownloads': '다운로드순',
    'admin.sortLikes': '좋아요순',
    'admin.deleteSelected': '선택 항목 삭제',
    'admin.name': '이름',
    'admin.category': '카테고리',
    'admin.size': '크기',
    'admin.downloads': '다운로드',
    'admin.likes': '좋아요',
    'admin.date': '날짜',
    'admin.actions': '작업',
    'admin.noSounds': '사운드가 없습니다',
    'admin.loading': '사운드 로딩 중...',
    'admin.prev': '← 이전',
    'admin.next': '다음 →',
    'admin.confirmDelete': '삭제 확인',
    'admin.deleteWarning': '이 사운드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    'admin.delete': '삭제',
    'admin.mobileTitle': '보기 전용 모드',
    'admin.mobileMessage': '사운드 삭제는 데스크톱에서만 가능합니다. 모바일에서는 통계 확인과 사운드 목록 조회가 가능합니다.',
    'admin.analyticsRange': '기간',
    'admin.analyticsLanguage': '언어',
    'admin.analyticsEntryChannel': '유입 채널',
    'admin.analyticsDevice': '디바이스',
    'admin.analyticsRefresh': '새로고침',
    'admin.range7d': '최근 7일',
    'admin.range14d': '최근 14일',
    'admin.range30d': '최근 30일',
    'admin.range60d': '최근 60일',
    'admin.deviceDesktop': '데스크톱',
    'admin.deviceMobile': '모바일',
    'admin.deviceTablet': '태블릿',
    'admin.kpiMau': 'MAU (30일)',
    'admin.kpiDau': 'DAU (24시간)',
    'admin.kpiActivationRate': '활성화율',
    'admin.kpiD7Retention': 'D7 잔존율',
    'admin.funnelConversion': '퍼널 전환율',
    'admin.retentionTrend': 'D7 잔존 추이 (14 코호트)',
    'admin.funnelLanding': '랜딩',
    'admin.funnelSoundOpen': '사운드 열기',
    'admin.funnelTrimComplete': '트림 완료',
    'admin.funnelSaveUsb': 'USB 저장',
    'admin.funnelShareGallery': '갤러리 공유',
    'admin.chartUploads': '업로드',
    'admin.chartUsers': '사용자',
    'admin.chartD7RetentionPct': 'D7 잔존율 %',
    'admin.noSoundsAvailable': '표시할 사운드가 없습니다',
    'admin.selectedCount': '{count}개 선택됨',
    'admin.pageOf': '{page} / {total} 페이지',

    // V2 UI
    'v2.createFromScratch': '처음부터 만들기',
    'v2.use': '사용',
    'v2.editorTitle': '사운드 편집',
    'v2.durationLabel': '길이: {duration}초',
    'v2.readyForTesla': '테슬라 사용 가능 (2-5초)',
    'v2.tooShort': '너무 짧습니다 ({duration}초) - 최소 2초',
    'v2.tooLong': '너무 깁니다 ({duration}초) - 최대 5초',
    'v2.likeFailed': '좋아요 처리에 실패했습니다.',
    'v2.nameYourSound': '사운드 이름:',
    'v2.nameRequired': '이름을 입력해주세요',
    'v2.uploadFailed': '업로드 실패',
    'v2.emptyTitle': '아직 사운드가 없습니다',
    'v2.emptySubtitle': '첫 번째 커스텀 잠금 사운드를 업로드해보세요!',
    'v2.or': '또는',
    'v2.done': '완료',
    'v2.ranking.item': '#{rank} {name} ({score}점)',
    'v2.ranking.empty': '아직 랭킹 데이터가 없습니다.',
    'v2.ranking.unavailable': '현재 랭킹을 불러올 수 없습니다.',
    'v2.challenge.title': '주간 챌린지 & 랭킹',
    'v2.challenge.subtitle': '저장, 업로드, 공유를 완료해 이번 주 챌린지를 달성하세요.',
    'v2.challenge.saveProgress': 'USB 저장: {current}/{target} ({percent}%)',
    'v2.challenge.uploadProgress': '갤러리 업로드: {current}/{target} ({percent}%)',
    'v2.challenge.shareProgress': '갤러리 공유: {current}/{target} ({percent}%)',
    'v2.challenge.completed': '챌린지 완료. 주간 크리에이터 배지가 해금되었습니다.',
    'v2.challenge.incomplete': '3개 항목을 모두 완료하면 이번 주 챌린지를 달성합니다.',
    'v2.challenge.modelLabel': '모델 챌린지',
    'v2.challenge.modelTarget': '{model} 목표: 저장 {saves}, 업로드 {uploads}, 공유 {shares}',
    'v2.signature.title': '내 테슬라 시그니처 팩',
    'v2.signature.subtitle': '테슬라 프로필을 설정하고 맞춤형 3개 사운드 팩을 받아보세요.',
    'v2.signature.nicknamePlaceholder': '닉네임 (선택)',
    'v2.signature.saveProfile': '프로필 저장',
    'v2.signature.generate': '팩 생성',
    'v2.signature.profileSaved': '프로필이 저장되었습니다.',
    'v2.signature.packTitle': '{owner} 시그니처 사운드 팩',
    'v2.signature.apply': '사용',
    'v2.auth.google': 'Google로 계속하기',
    'v2.auth.gateTitle': '내 테슬라를 더 특별하게',
    'v2.auth.gateSubtitle': '로그인하면 내 테슬라 시그니처 팩과 Garage 배지 진열장을 사용할 수 있습니다.',
    'v2.auth.logout': '로그아웃',
    'v2.auth.signedOut': '기기 간 프로필 동기화를 위해 로그인하세요.',
    'v2.auth.signedInAs': '{name} 계정으로 로그인됨',
    'v2.auth.unavailable': '현재 환경에서는 인증을 사용할 수 없습니다.',
    'v2.auth.loginSuccess': '로그인되었습니다.',
    'v2.auth.loginFailed': '로그인에 실패했습니다. OAuth 제공자 설정을 확인하세요.',
    'v2.auth.loggedOut': '로그아웃되었습니다.',
    'v2.auth.logoutFailed': '로그아웃에 실패했습니다.',
    'v2.badges.title': 'Garage 배지 진열장',
    'v2.badges.subtitle': '시그니처 사운드를 만들고 저장하고 공유해 배지를 잠금 해제하세요.',
    'v2.badges.summary': '배지 해금 {unlocked}/{total}',
    'v2.badges.unlockedState': '해금됨',
    'v2.badges.lockedState': '잠김',
    'v2.badges.unlocked': '배지 해금: {badge}',
    'v2.badges.signatureStylist': '시그니처 스타일리스트',
    'v2.badges.signatureStylistDesc': '첫 시그니처 팩을 생성함',
    'v2.badges.firstLock': '첫 락 저장',
    'v2.badges.firstLockDesc': '첫 락 사운드를 USB에 저장함',
    'v2.badges.galleryRookie': '갤러리 루키',
    'v2.badges.galleryRookieDesc': '첫 커뮤니티 사운드를 업로드함',
    'v2.badges.modelChampion': '모델 챔피언',
    'v2.badges.modelChampionDesc': '모델 챌린지 1회 완료',
    'v2.badges.communityCrafter': '커뮤니티 크래프터',
    'v2.badges.communityCrafterDesc': '커뮤니티에 사운드 5회 공유',
    'v2.badges.garageLegend': 'Garage 레전드',
    'v2.badges.garageLegendDesc': '배지 5개 해금',
    'v2.workspace.title': '내 작업공간',
    'v2.workspace.subtitle': '버전 히스토리와 함께 임시저장을 남기고 나중에 이어서 작업하세요.',
    'v2.workspace.draftPlaceholder': '드래프트 이름',
    'v2.workspace.saveDraft': '드래프트 버전 저장',
    'v2.draft.enterName': '먼저 드래프트 이름을 입력해주세요.',
    'v2.draft.saved': '드래프트 버전이 저장되었습니다.',
    'v2.draft.empty': '저장된 드래프트가 없습니다.',
    'v2.draft.load': '불러오기',
    'v2.draft.delete': '삭제',
    'v2.draft.meta': '버전: {versions} | 최신 트림: {start}초 - {end}초',
    'v2.draft.sourceMissing': '갤러리에서 드래프트 원본을 불러올 수 없습니다.',
    'v2.draft.loaded': '드래프트 불러옴: {name}',
    'v2.uploadModal.title': '사운드 업로드',
    'v2.uploadModal.dropText': '오디오 파일을 여기에 놓거나 찾아보기를 눌러 업로드',
    'v2.success.title': '사운드 적용 완료!',
    'v2.success.subtitle': '커스텀 잠금 사운드가 준비되었습니다',
    'v2.success.nextSteps': '다음 단계:',
    'v2.success.step1': 'USB를 안전하게 분리',
    'v2.success.step2': 'Tesla에 USB 연결',
    'v2.success.step3': 'Toybox → Boombox → Lock Sound → USB',
    'v2.createModal.title': '새 사운드 만들기',
    'v2.createModal.subtitle': '프리셋을 선택하거나 직접 업로드하세요',
    'v2.createModal.uploadOwn': '내 오디오 업로드',
    'v2.presetSound': '프리셋 사운드',

  },

  ja: {
    // Navigation & Tabs
    'nav.createSound': 'サウンド作成',
    'nav.gallery': 'コミュニティギャラリー',
    'nav.browseGallery': 'ギャラリーを見る →',

    // Headers
    'header.title': 'テスラロックサウンドメーカー',
    'header.free': '100%無料',
    'header.compatibility': 'PC専用 - ChromeまたはEdge必須',
    'header.compatibilityNote': 'このツールはデスクトップのChromeとEdgeでのみ利用可能なFile System Access APIを使用しています。',

    // Steps
    'step1.title': 'サウンドを選択',
    'step2.title': 'サウンドをトリミング',
    'step2.duration': '長さは2〜5秒である必要があります',
    'step3.title': '保存＆共有',

    // Upload
    'upload.divider': 'または自分のオーディオをアップロード',
    'upload.click': 'クリックしてアップロード',
    'upload.dragDrop': 'またはドラッグ＆ドロップ',
    'upload.formats': 'WAV, MP3, M4A, OGG（最大10MB）',
    'upload.explore': 'またはコミュニティサウンドを探索',

    // Buttons
    'btn.preview': 'プレビュー',
    'btn.previewTrimmed': 'トリミング版をプレビュー',
    'btn.stop': '⏹ 停止',
    'btn.changeSound': '← サウンドを変更',
    'btn.saveUsb': 'USBに保存',
    'btn.download': 'ダウンロード',
    'btn.uploadGallery': 'ギャラリーにアップロード',
    'btn.createAnother': '別のサウンドを作成',
    'btn.loadMore': 'もっと見る',
    'btn.search': '検索',
    'btn.cancel': 'キャンセル',
    'btn.upload': 'アップロード',
    'btn.copy': 'コピー',
    'btn.share': '共有...',

    // Form Labels
    'form.start': '開始',
    'form.end': '終了',
    'form.sec': '秒',
    'form.duration': '長さ',
    'form.volume': '音量',
    'form.fadeIn': 'フェードイン',
    'form.fadeOut': 'フェードアウト',
    'form.soundName': 'サウンド名 *',
    'form.description': '説明',
    'form.category': 'カテゴリ',
    'form.namePlaceholder': 'サウンド名を入力',
    'form.descPlaceholder': 'サウンドの説明（任意）',
    'form.searchPlaceholder': 'サウンドを検索...',
    'form.sortBy': '並び替え:',
    'form.categoryFilter': 'カテゴリ:',

    // Sort Options
    'sort.newest': '新着順',
    'sort.mostLiked': '人気順',
    'sort.mostDownloaded': 'ダウンロード順',

    // Categories
    'cat.all': 'すべて',
    'cat.classic': 'クラシック',
    'cat.modern': 'モダン',
    'cat.futuristic': '未来的',
    'cat.custom': 'カスタム',
    'cat.funny': '面白い',
    'cat.musical': '音楽的',

    // Gallery
    'gallery.title': 'コミュニティギャラリー',
    'gallery.subtitle': '世界中のテスラオーナーとカスタムロックサウンドを共有しましょう',
    'gallery.uploadYour': 'サウンドをアップロード',
    'gallery.myUploads': 'マイアップロード',
    'gallery.trending': '今週のトレンド',
    'gallery.hot': '人気',
    'gallery.sounds': 'サウンド',
    'gallery.downloads': 'ダウンロード',
    'gallery.likes': 'いいね',
    'gallery.loading': 'コミュニティサウンドを読み込み中...',
    'gallery.noResults': '検索結果が見つかりませんでした。',
    'gallery.noCategory': 'このカテゴリにはまだサウンドがありません。最初に共有しましょう！',
    'gallery.empty': 'まだコミュニティサウンドがありません。最初に共有しましょう！',
    'gallery.myEmpty': 'まだアップロードしたサウンドがありません。最初のサウンドを作成して共有しましょう！',
    'gallery.loadFailed': 'ギャラリーの読み込みに失敗しました。もう一度お試しください。',

    // Status Messages
    'status.processing': 'オーディオを処理中...',
    'status.loading': 'サウンドを読み込み中...',
    'status.saving': 'USBに保存中...',
    'status.uploading': 'ギャラリーにアップロード中...',
    'status.loadingShared': '共有サウンドを読み込み中...',

    // Success Messages
    'success.title': '成功！',
    'success.saved': 'カスタムロックサウンドがUSBドライブに保存されました。',
    'success.uploaded': 'ギャラリーにアップロードされました！',
    'success.loaded': 'ギャラリーからサウンドを読み込みました！',
    'success.downloaded': 'ファイルがダウンロードされました！',
    'success.audioUploaded': 'オーディオがアップロードされました！',

    // Error Messages
    'error.fileTooLarge': 'ファイルが大きすぎます。最大サイズは10MBです。',
    'error.invalidType': '無効なファイル形式です。WAV、MP3、M4AまたはOGGファイルをアップロードしてください。',
    'error.processAudio': 'オーディオファイルを処理できませんでした。別のファイルをお試しください。',
    'error.notFound': '共有サウンドが見つかりませんでした',
    'error.downloadFailed': 'ファイルをダウンロードできませんでした。',
    'error.galleryUnavailable': 'ギャラリーが利用できません。後でもう一度お試しください。',
    'error.playFailed': 'オーディオを再生できませんでした。オーディオ設定を確認してください。',
    'error.loadFailed': 'サウンドの読み込み中にエラーが発生しました。もう一度お試しください。',
    'error.saveFailed': '直接保存できませんでした',

    // Prompts
    'prompt.downloadInstead': '代わりにファイルをダウンロードしますか？',
    'prompt.createFirst': '最初にサウンドを作成してからギャラリーにアップロードしてください！',

    // Browser Compatibility
    'compat.title': 'デスクトップブラウザが必要',
    'compat.requirement': 'このツールはデスクトップコンピュータのChromeまたはEdgeが必要です。',
    'compat.explanation': 'USBに直接ファイルを保存するために必要なFile System Access APIは以下では利用できません:',
    'compat.safari': 'Safari（すべてのプラットフォーム）',
    'compat.firefox': 'Firefox（すべてのプラットフォーム）',
    'compat.mobile': 'モバイルブラウザ',
    'compat.tablet': 'タブレット',
    'compat.instruction': 'PCのChromeまたはEdgeでこのページを開いてください。',

    // Instructions
    'inst.usbHint': 'USBドライブを選択するよう求められます。USBドライブのルートフォルダを選択してください。',
    'inst.qrHint': '別のデバイスで開くにはスキャン',
    'inst.howTo': 'テスラでの使用方法:',
    'inst.step1': 'コンピュータからUSBドライブを安全に取り外す',
    'inst.step2': 'テスラのUSBポートにUSBドライブを接続',
    'inst.step3': 'タッチスクリーンでToyboxに移動',
    'inst.step4': 'Boomboxを選択',
    'inst.step5': 'Lock Soundをタップ',
    'inst.step6': 'USBを選択してカスタムサウンドを使用',

    // Share Modal
    'share.title': 'サウンドを共有',
    'share.social': 'ソーシャルメディアで共有',
    'share.link': '共有リンク',
    'share.qr': 'QRコード',
    'share.twitter': 'Twitter',
    'share.facebook': 'Facebook',
    'share.whatsapp': 'WhatsApp',
    'share.telegram': 'Telegram',
    'share.message': 'このテスラロックサウンドをチェック: 「{name}」 - オリジナルのカスタムロックサウンドを作ろう！',

    // Upload Modal
    'uploadModal.title': 'ギャラリーにアップロード',
    'uploadModal.legalNotice': 'アップロードすることで、音源の権利を保有している、または利用許諾を得ていることを確認したものとみなされます。著作権を侵害するコンテンツは削除される場合があります。',

    // Footer
    'footer.privacy': 'プライバシーポリシー',
    'footer.terms': '利用規約',
    'footer.disclaimer': 'このツールは非公式であり、Tesla, Inc.とは関係ありません。TeslaおよびTeslaロゴはTesla, Inc.の商標です。',
    'footer.copyright': '© 2024 Tesla Lock Sound Creator. 無料で使用可能。アカウント不要。',

    // Language
    'lang.select': '言語',
    'lang.en': 'English',
    'lang.ko': '한국어',
    'lang.ja': '日本語',
    'lang.zh': '中文',

    // Admin Dashboard
    'admin.title': '管理者ダッシュボード',
    'admin.loginSubtitle': 'Tesla Lock Sound Creatorを管理するにはサインインしてください',
    'admin.signInGoogle': 'Googleでサインイン',
    'admin.adminOnly': '認証された管理者のみがこのページにアクセスできます。',
    'admin.accessDenied': 'アクセス拒否',
    'admin.notAuthorized': 'あなたのアカウントは管理者ダッシュボードへのアクセス権限がありません。',
    'admin.tryAnother': '別のアカウントを試す',
    'admin.logout': 'ログアウト',
    'admin.totalSounds': '合計サウンド',
    'admin.totalDownloads': '合計ダウンロード',
    'admin.totalLikes': '合計いいね',
    'admin.weeklyUploads': '今週',
    'admin.categoryDistribution': 'カテゴリ分布',
    'admin.uploadTrend': 'アップロード推移（30日）',
    'admin.topSounds': '人気サウンドTop 10',
    'admin.soundManagement': 'サウンド管理',
    'admin.searchPlaceholder': 'サウンドを検索...',
    'admin.sortNewest': '新着順',
    'admin.sortOldest': '古い順',
    'admin.sortDownloads': 'ダウンロード順',
    'admin.sortLikes': 'いいね順',
    'admin.deleteSelected': '選択項目を削除',
    'admin.name': '名前',
    'admin.category': 'カテゴリ',
    'admin.size': 'サイズ',
    'admin.downloads': 'ダウンロード',
    'admin.likes': 'いいね',
    'admin.date': '日付',
    'admin.actions': '操作',
    'admin.noSounds': 'サウンドが見つかりません',
    'admin.loading': 'サウンドを読み込み中...',
    'admin.prev': '← 前へ',
    'admin.next': '次へ →',
    'admin.confirmDelete': '削除の確認',
    'admin.deleteWarning': 'このサウンドを削除しますか？この操作は元に戻せません。',
    'admin.delete': '削除',
    'admin.mobileTitle': '閲覧専用モード',
    'admin.mobileMessage': 'サウンドの削除はデスクトップでのみ可能です。モバイルでは統計の確認とサウンドの閲覧ができます。',
    'admin.analyticsRange': '期間',
    'admin.analyticsLanguage': '言語',
    'admin.analyticsEntryChannel': '流入チャネル',
    'admin.analyticsDevice': 'デバイス',
    'admin.analyticsRefresh': '更新',
    'admin.range7d': '過去7日',
    'admin.range14d': '過去14日',
    'admin.range30d': '過去30日',
    'admin.range60d': '過去60日',
    'admin.deviceDesktop': 'デスクトップ',
    'admin.deviceMobile': 'モバイル',
    'admin.deviceTablet': 'タブレット',
    'admin.kpiMau': 'MAU (30日)',
    'admin.kpiDau': 'DAU (24時間)',
    'admin.kpiActivationRate': '活性化率',
    'admin.kpiD7Retention': 'D7継続率',
    'admin.funnelConversion': 'ファネル転換率',
    'admin.retentionTrend': 'D7継続トレンド（14コホート）',
    'admin.funnelLanding': 'ランディング',
    'admin.funnelSoundOpen': 'サウンド表示',
    'admin.funnelTrimComplete': 'トリム完了',
    'admin.funnelSaveUsb': 'USB保存',
    'admin.funnelShareGallery': 'ギャラリー共有',
    'admin.chartUploads': 'アップロード',
    'admin.chartUsers': 'ユーザー',
    'admin.chartD7RetentionPct': 'D7継続率 %',
    'admin.noSoundsAvailable': '表示できるサウンドがありません',
    'admin.selectedCount': '{count}件を選択',
    'admin.pageOf': '{total}ページ中 {page}ページ',
  },

  zh: {
    // Navigation & Tabs
    'nav.createSound': '创建声音',
    'nav.gallery': '社区画廊',
    'nav.browseGallery': '浏览画廊 →',

    // Headers
    'header.title': '特斯拉锁车声音制作器',
    'header.free': '100%免费',
    'header.compatibility': '仅限PC - 需要Chrome或Edge',
    'header.compatibilityNote': '此工具使用的File System Access API仅在桌面版Chrome和Edge中可用。',

    // Steps
    'step1.title': '选择声音',
    'step2.title': '修剪声音',
    'step2.duration': '时长必须在2-5秒之间',
    'step3.title': '保存和分享',

    // Upload
    'upload.divider': '或上传您自己的音频',
    'upload.click': '点击上传',
    'upload.dragDrop': '或拖放文件',
    'upload.formats': 'WAV, MP3, M4A, OGG（最大10MB）',
    'upload.explore': '或探索社区声音',

    // Buttons
    'btn.preview': '预览',
    'btn.previewTrimmed': '预览修剪版',
    'btn.stop': '⏹ 停止',
    'btn.changeSound': '← 更换声音',
    'btn.saveUsb': '保存到USB',
    'btn.download': '下载',
    'btn.uploadGallery': '上传到画廊',
    'btn.createAnother': '创建另一个声音',
    'btn.loadMore': '加载更多',
    'btn.search': '搜索',
    'btn.cancel': '取消',
    'btn.upload': '上传',
    'btn.copy': '复制',
    'btn.share': '分享...',

    // Form Labels
    'form.start': '开始',
    'form.end': '结束',
    'form.sec': '秒',
    'form.duration': '时长',
    'form.volume': '音量',
    'form.fadeIn': '淡入',
    'form.fadeOut': '淡出',
    'form.soundName': '声音名称 *',
    'form.description': '描述',
    'form.category': '分类',
    'form.namePlaceholder': '为您的声音命名',
    'form.descPlaceholder': '描述您的声音（可选）',
    'form.searchPlaceholder': '搜索声音...',
    'form.sortBy': '排序:',
    'form.categoryFilter': '分类:',

    // Sort Options
    'sort.newest': '最新',
    'sort.mostLiked': '最受欢迎',
    'sort.mostDownloaded': '下载最多',

    // Categories
    'cat.all': '全部',
    'cat.classic': '经典',
    'cat.modern': '现代',
    'cat.futuristic': '未来',
    'cat.custom': '自定义',
    'cat.funny': '有趣',
    'cat.musical': '音乐',

    // Gallery
    'gallery.title': '社区画廊',
    'gallery.subtitle': '与全球特斯拉车主发现和分享自定义锁车声音',
    'gallery.uploadYour': '上传您的声音',
    'gallery.myUploads': '我的上传',
    'gallery.trending': '本周热门',
    'gallery.hot': '热门',
    'gallery.sounds': '声音',
    'gallery.downloads': '下载',
    'gallery.likes': '喜欢',
    'gallery.loading': '正在加载社区声音...',
    'gallery.noResults': '没有找到匹配的声音。',
    'gallery.noCategory': '此分类暂无声音。成为第一个分享的人！',
    'gallery.empty': '暂无社区声音。成为第一个分享的人！',
    'gallery.myEmpty': '您还没有上传任何声音。创建并分享您的第一个声音！',
    'gallery.loadFailed': '加载画廊失败。请重试。',

    // Status Messages
    'status.processing': '正在处理音频...',
    'status.loading': '正在加载声音...',
    'status.saving': '正在保存到USB...',
    'status.uploading': '正在上传到画廊...',
    'status.loadingShared': '正在加载分享的声音...',

    // Success Messages
    'success.title': '成功！',
    'success.saved': '您的自定义锁车声音已保存到USB驱动器。',
    'success.uploaded': '已上传到画廊！',
    'success.loaded': '已从画廊加载声音！',
    'success.downloaded': '文件已下载！',
    'success.audioUploaded': '音频上传成功！',

    // Error Messages
    'error.fileTooLarge': '文件太大。最大大小为10MB。',
    'error.invalidType': '无效的文件类型。请上传WAV、MP3、M4A或OGG文件。',
    'error.processAudio': '无法处理音频文件。请尝试其他文件。',
    'error.notFound': '找不到分享的声音',
    'error.downloadFailed': '无法下载文件。',
    'error.galleryUnavailable': '画廊不可用。请稍后再试。',
    'error.playFailed': '无法播放音频。请检查您的音频设置。',
    'error.loadFailed': '加载声音时出错。请重试。',
    'error.saveFailed': '无法直接保存',

    // Prompts
    'prompt.downloadInstead': '您想下载文件吗？',
    'prompt.createFirst': '请先创建声音，然后上传到画廊！',

    // Browser Compatibility
    'compat.title': '需要桌面浏览器',
    'compat.requirement': '此工具需要桌面电脑上的Chrome或Edge。',
    'compat.explanation': '直接保存文件到USB所需的File System Access API在以下环境中不可用:',
    'compat.safari': 'Safari（所有平台）',
    'compat.firefox': 'Firefox（所有平台）',
    'compat.mobile': '移动浏览器',
    'compat.tablet': '平板电脑',
    'compat.instruction': '请在PC上使用Chrome或Edge打开此页面。',

    // Instructions
    'inst.usbHint': '系统会提示您选择USB驱动器。选择USB驱动器的根文件夹。',
    'inst.qrHint': '扫描在其他设备上打开',
    'inst.howTo': '如何在特斯拉中使用:',
    'inst.step1': '从电脑安全弹出USB驱动器',
    'inst.step2': '将USB驱动器插入特斯拉的USB端口',
    'inst.step3': '在触摸屏上进入Toybox',
    'inst.step4': '选择Boombox',
    'inst.step5': '点击Lock Sound',
    'inst.step6': '选择USB使用您的自定义声音',

    // Share Modal
    'share.title': '分享声音',
    'share.social': '分享到社交媒体',
    'share.link': '分享链接',
    'share.qr': '二维码',
    'share.twitter': 'Twitter',
    'share.facebook': 'Facebook',
    'share.whatsapp': 'WhatsApp',
    'share.telegram': 'Telegram',
    'share.message': '看看这个特斯拉锁车声音: "{name}" - 创建您自己的自定义锁车声音！',

    // Upload Modal
    'uploadModal.title': '上传到画廊',
    'uploadModal.legalNotice': '上传即表示您确认拥有该音频的权利或已获得使用许可。涉嫌侵犯版权的内容可能会被删除。',

    // Footer
    'footer.privacy': '隐私政策',
    'footer.terms': '使用条款',
    'footer.disclaimer': '这是一个非官方工具，与Tesla, Inc.无关。Tesla和Tesla标志是Tesla, Inc.的商标。',
    'footer.copyright': '© 2024 Tesla Lock Sound Creator. 免费使用。无需账户。',

    // Language
    'lang.select': '语言',
    'lang.en': 'English',
    'lang.ko': '한국어',
    'lang.ja': '日本語',
    'lang.zh': '中文',

    // Admin Dashboard
    'admin.title': '管理员仪表板',
    'admin.loginSubtitle': '登录以管理Tesla Lock Sound Creator',
    'admin.signInGoogle': '使用Google登录',
    'admin.adminOnly': '只有授权的管理员才能访问此页面。',
    'admin.accessDenied': '访问被拒绝',
    'admin.notAuthorized': '您的账户没有权限访问管理员仪表板。',
    'admin.tryAnother': '尝试其他账户',
    'admin.logout': '登出',
    'admin.totalSounds': '总声音数',
    'admin.totalDownloads': '总下载数',
    'admin.totalLikes': '总点赞数',
    'admin.weeklyUploads': '本周',
    'admin.categoryDistribution': '分类分布',
    'admin.uploadTrend': '上传趋势（30天）',
    'admin.topSounds': '热门声音Top 10',
    'admin.soundManagement': '声音管理',
    'admin.searchPlaceholder': '搜索声音...',
    'admin.sortNewest': '最新优先',
    'admin.sortOldest': '最旧优先',
    'admin.sortDownloads': '下载最多',
    'admin.sortLikes': '点赞最多',
    'admin.deleteSelected': '删除选中',
    'admin.name': '名称',
    'admin.category': '分类',
    'admin.size': '大小',
    'admin.downloads': '下载',
    'admin.likes': '点赞',
    'admin.date': '日期',
    'admin.actions': '操作',
    'admin.noSounds': '未找到声音',
    'admin.loading': '正在加载声音...',
    'admin.prev': '← 上一页',
    'admin.next': '下一页 →',
    'admin.confirmDelete': '确认删除',
    'admin.deleteWarning': '确定要删除此声音吗？此操作无法撤销。',
    'admin.delete': '删除',
    'admin.mobileTitle': '仅查看模式',
    'admin.mobileMessage': '声音删除仅在桌面端可用。您可以在移动端查看统计数据和浏览声音。',
    'admin.analyticsRange': '时间范围',
    'admin.analyticsLanguage': '语言',
    'admin.analyticsEntryChannel': '来源渠道',
    'admin.analyticsDevice': '设备',
    'admin.analyticsRefresh': '刷新',
    'admin.range7d': '最近7天',
    'admin.range14d': '最近14天',
    'admin.range30d': '最近30天',
    'admin.range60d': '最近60天',
    'admin.deviceDesktop': '桌面端',
    'admin.deviceMobile': '移动端',
    'admin.deviceTablet': '平板',
    'admin.kpiMau': 'MAU（30天）',
    'admin.kpiDau': 'DAU（24小时）',
    'admin.kpiActivationRate': '激活率',
    'admin.kpiD7Retention': 'D7留存率',
    'admin.funnelConversion': '漏斗转化率',
    'admin.retentionTrend': 'D7留存趋势（14个队列）',
    'admin.funnelLanding': '落地页访问',
    'admin.funnelSoundOpen': '打开声音',
    'admin.funnelTrimComplete': '裁剪完成',
    'admin.funnelSaveUsb': '保存到USB',
    'admin.funnelShareGallery': '分享到画廊',
    'admin.chartUploads': '上传量',
    'admin.chartUsers': '用户数',
    'admin.chartD7RetentionPct': 'D7留存率 %',
    'admin.noSoundsAvailable': '暂无可用声音',
    'admin.selectedCount': '已选择 {count} 项',
    'admin.pageOf': '第 {page} / {total} 页',
  }
};

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'ko', 'ja', 'zh'];
const DEFAULT_LANGUAGE = 'en';

class I18n {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.translations = TRANSLATIONS;
  }

  /**
   * Detect user's preferred language
   */
  detectLanguage() {
    // Check localStorage first
    const saved = localStorage.getItem('app_language');
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
      return saved;
    }

    // Check browser language
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0].toLowerCase();

    // Map Chinese variants
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }

    if (SUPPORTED_LANGUAGES.includes(langCode)) {
      return langCode;
    }

    return DEFAULT_LANGUAGE;
  }

  /**
   * Get current language
   */
  getLanguage() {
    return this.currentLang;
  }

  /**
   * Set language
   */
  setLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      console.warn(`Language ${lang} is not supported`);
      return false;
    }

    this.currentLang = lang;
    localStorage.setItem('app_language', lang);
    document.documentElement.lang = lang;
    this.updatePage();
    return true;
  }

  /**
   * Get translation for a key
   */
  t(key, params = {}) {
    const translation = this.translations[this.currentLang]?.[key]
      || this.translations[DEFAULT_LANGUAGE]?.[key]
      || key;

    // Replace placeholders like {name}
    return translation.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }

  /**
   * Update all elements with data-i18n attribute
   */
  updatePage() {
    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    // Update aria-labels
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      el.setAttribute('aria-label', this.t(key));
    });

    // Update title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });

    // Dispatch event for dynamic content
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: this.currentLang }
    }));
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES.map(code => ({
      code,
      name: this.translations[code]['lang.' + code],
      nativeName: this.translations[code]['lang.' + code]
    }));
  }
}

// Create global instance
const i18n = new I18n();

// Browser global export
if (typeof window !== 'undefined') {
  window.i18n = i18n;
  window.t = (key, params) => i18n.t(key, params);
}
