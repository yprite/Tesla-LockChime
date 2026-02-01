# Tesla Lock Sound Creator

A free, production-ready web application that allows Tesla owners to create custom lock chime sounds and save them directly to a USB drive.

## Features

- **100% Free** - No payments, no subscriptions, no accounts required
- **12 Pre-made Sounds** - Classic, modern, and sci-fi categories
- **Upload Your Own Audio** - Import WAV, MP3, M4A, or OGG files
- **Visual Waveform Editor** - Trim audio with intuitive drag handles
- **Volume Control** - Adjust output volume
- **Fade Effects** - Add fade in/out to your sound
- **Audio Normalization** - Automatically optimizes volume levels
- **Direct USB Save** - Save directly to USB drive using File System Access API
- **Share with Friends** - Share your custom sounds via URL or native sharing
- **Import Shared Sounds** - Click a shared link to instantly use a friend's sound
- **PWA Support** - Install as an app, works offline (UI only)
- **Fully Accessible** - WCAG 2.1 compliant with keyboard navigation

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome (Desktop) | ✅ Supported |
| Edge (Desktop) | ✅ Supported |
| Safari | ❌ Not Supported |
| Firefox | ❌ Not Supported |
| Mobile Browsers | ❌ Not Supported |

This tool requires the **File System Access API** which is only available in Chromium-based browsers on desktop computers.

## Tesla Requirements

- Tesla vehicle with Boombox feature (Model S, 3, X, Y with external speaker)
- USB drive formatted as FAT32 or exFAT
- Software version that supports custom lock sounds

## Quick Start

### User Flow

1. **Visit the Website** - Open in Chrome or Edge on a desktop PC
2. **Select or Upload a Sound** - Choose from 12 pre-made sounds, or upload your own audio file
3. **Customize** - Trim to 2-5 seconds, adjust volume, add fades
4. **Save & Share** - Save to USB drive, download, or share with friends via link
5. **Use in Tesla** - Follow on-screen instructions

### Sharing Sounds

Share your custom lock sounds with friends:

1. After customizing your sound, click **Copy Link** to copy a shareable URL
2. Send the link to your friend
3. When they open the link, they'll see a banner to import your sound instantly
4. They can then customize and save it to their own USB drive

### Tesla Setup

1. Safely eject the USB drive from your computer
2. Plug the USB drive into your Tesla's USB port
3. Go to **Toybox** → **Boombox** → **Lock Sound** → **USB**

## Technical Specifications

### Output File

| Property | Value |
|----------|-------|
| File Name | `LockChime.wav` (exact) |
| Format | WAV (PCM) |
| Channels | Mono |
| Sample Rate | 44.1 kHz |
| Bit Depth | 16-bit |
| Duration | 2-5 seconds |
| Max File Size | ~1 MB |

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Static Web Application (No Server)          │
├─────────────────────────────────────────────────────────┤
│  Web Audio API    │  Canvas API     │  File System API  │
│  ─────────────    │  ─────────      │  ───────────────  │
│  • Synthesis      │  • Waveform     │  • USB Write      │
│  • Playback       │  • Trim UI      │  • Save Picker    │
│  • Processing     │  • Animation    │  • Fallback DL    │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
Tesla-LockChime/
├── index.html           # Main page with SEO & accessibility
├── manifest.json        # PWA manifest
├── sw.js               # Service worker for offline support
├── offline.html        # Offline fallback page
├── css/
│   └── styles.css      # Responsive styling with a11y
├── js/
│   ├── app.js          # Main application controller
│   ├── audio-data.js   # 12 synthesized sounds + WAV encoder
│   ├── audio-processor.js  # Playback, trimming, effects
│   ├── file-system.js  # File System Access API
│   ├── sharing.js      # URL sharing & Web Share API
│   └── waveform.js     # Canvas waveform visualizer
├── src/                # ES modules for testing
├── tests/              # Vitest unit tests (179 tests)
├── images/             # PWA icons
└── README.md
```

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/yprite/Tesla-LockChime.git
cd Tesla-LockChime
npm install
```

### Commands

```bash
npm test          # Run all tests
npm run test:watch  # Watch mode
npm run dev       # Start local server (port 3000)
```

### Testing

The project has comprehensive unit tests:

```
✓ tests/audio-data.test.js (26 tests)
✓ tests/audio-processor.test.js (56 tests)
✓ tests/file-system.test.js (30 tests)
✓ tests/sharing.test.js (28 tests)
✓ tests/waveform.test.js (39 tests)
─────────────────────────────────────
Total: 179 tests passing
```

## Deployment

### Static Hosting

Deploy to any static hosting service:

- **Vercel**: `vercel deploy`
- **Netlify**: Connect GitHub repo
- **GitHub Pages**: Enable in repo settings
- **Cloudflare Pages**: Connect GitHub repo

**Requirements:**
- HTTPS (required for File System Access API)
- No build step needed (static files)

### Configuration

1. **Analytics**: Replace `G-XXXXXXXXXX` in `index.html` with your GA4 ID
2. **AdSense**: Uncomment and add your AdSense code in `index.html`
3. **Domain**: Update canonical URL and OG tags in `index.html`

### Performance

The site is optimized for performance:
- No external dependencies (vanilla JS)
- Service worker caching
- Minimal CSS (~15KB)
- Synthesized audio (no audio file downloads)

## Monetization

Display advertising only (non-intrusive):

- Header ad slot (728x90 leaderboard)
- Footer ad slot (728x90 leaderboard)
- No popups or interstitials
- Google AdSense ready

## Accessibility

WCAG 2.1 Level AA compliant:

- Skip to main content link
- Full keyboard navigation
- Screen reader support (ARIA)
- Focus indicators
- High contrast mode support
- Reduced motion support
- Semantic HTML structure

## Security

- No server-side code
- No user data collection
- No cookies (except analytics)
- Content Security Policy ready
- All processing client-side

## License

MIT License - Feel free to use, modify, and distribute.

## Disclaimer

This tool is not affiliated with, endorsed by, or sponsored by Tesla, Inc. Tesla and the Tesla logo are trademarks of Tesla, Inc.

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Submit a pull request

### Completed Features

- [x] 12 synthesized sounds
- [x] User-uploaded audio files (WAV, MP3, M4A, OGG)
- [x] Volume control
- [x] Fade in/out effects
- [x] Audio normalization
- [x] URL-based sound sharing
- [x] Web Share API integration
- [x] Import shared sounds from links
- [x] PWA with offline support
- [x] Full accessibility
- [x] SEO optimization
- [x] Analytics integration
- [x] AdSense integration

### Potential Improvements

- [ ] More sound effects
- [ ] Internationalization (i18n)
- [ ] Sound categories filter UI
- [ ] Undo/redo for edits
- [ ] QR code sharing for easier mobile-to-PC transfer
