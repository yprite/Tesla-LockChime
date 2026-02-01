# Tesla Lock Sound Creator

A free, production-ready web application that allows Tesla owners to create custom lock chime sounds and save them directly to a USB drive.

🌐 [한국어 버전 (Korean)](./README.ko.md)

## Features

- **100% Free** - No payments, no subscriptions, no accounts required
- **12 Pre-made Sounds** - Classic, modern, and sci-fi categories
- **Upload Your Own Audio** - Import WAV, MP3, M4A, or OGG files
- **Visual Waveform Editor** - Trim audio with intuitive drag handles
- **Volume Control** - Adjust output volume
- **Fade Effects** - Add fade in/out to your sound
- **Audio Normalization** - Automatically optimizes volume levels
- **Direct USB Save** - Save directly to USB drive using File System Access API
- **Community Gallery** - Browse, download, and share sounds with the community
- **PWA Support** - Install as an app, works offline (UI only)
- **Fully Accessible** - WCAG 2.1 compliant with keyboard navigation

## Community Gallery

Share your custom sounds with Tesla owners worldwide:

- **Upload** - Share your creations to the community gallery
- **Browse** - Discover sounds created by other users
- **Search & Filter** - Find sounds by name or category
- **Like & Download** - Save your favorites and track popularity
- **Categories** - Classic, Modern, Futuristic, Custom, Funny, Musical

> Note: Community gallery requires Firebase configuration. See [Setup Guide](./doc/SETUP_GUIDE.md).

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
2. **Select or Upload a Sound** - Choose from 12 pre-made sounds, browse the community gallery, or upload your own audio file
3. **Customize** - Trim to 2-5 seconds, adjust volume, add fades
4. **Save & Share** - Save to USB drive, download, or upload to the community gallery
5. **Use in Tesla** - Follow on-screen instructions

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
┌─────────────────────────────────────────────────────────────┐
│                    Web Application                           │
├─────────────────────────────────────────────────────────────┤
│  Web Audio API  │  Canvas API   │  File System  │  Firebase │
│  ────────────   │  ──────────   │  ───────────  │  ──────── │
│  • Synthesis    │  • Waveform   │  • USB Write  │  • Gallery│
│  • Playback     │  • Trim UI    │  • Save Picker│  • Storage│
│  • Processing   │  • Animation  │  • Fallback   │  • Likes  │
└─────────────────────────────────────────────────────────────┘
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
│   ├── gallery.js      # Community gallery (Firebase)
│   └── waveform.js     # Canvas waveform visualizer
├── src/                # ES modules for testing
├── tests/              # Vitest unit tests (205 tests)
├── doc/                # Documentation
│   └── SETUP_GUIDE.md  # Firebase setup guide
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
✓ tests/gallery.test.js (54 tests)
✓ tests/waveform.test.js (39 tests)
─────────────────────────────────────
Total: 205 tests passing
```

## Deployment

### Static Hosting (Without Gallery)

Deploy to any static hosting service:

- **Vercel**: `vercel deploy`
- **Netlify**: Connect GitHub repo
- **GitHub Pages**: Enable in repo settings
- **Cloudflare Pages**: Connect GitHub repo

### With Community Gallery

To enable the community gallery feature:

1. Create a Firebase project
2. Configure Firestore and Storage
3. Update `js/gallery.js` with your Firebase config
4. Deploy to Firebase Hosting (recommended) or other platforms

See [Setup Guide](./doc/SETUP_GUIDE.md) for detailed instructions.

**Requirements:**
- HTTPS (required for File System Access API)
- Firebase project (for gallery features)

### Configuration

1. **Firebase**: Follow the [Setup Guide](./doc/SETUP_GUIDE.md)
2. **Analytics**: Replace `G-XXXXXXXXXX` in `index.html` with your GA4 ID
3. **AdSense**: Uncomment and add your AdSense code in `index.html`
4. **Domain**: Update canonical URL and OG tags in `index.html`

### Performance

The site is optimized for performance:
- Minimal external dependencies
- Service worker caching
- Minimal CSS (~20KB)
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

- No user authentication required
- Anonymous user IDs for gallery (localStorage)
- No sensitive data collection
- Content Security Policy ready
- All audio processing client-side

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
- [x] Community sound gallery
- [x] Browse, search, filter sounds
- [x] Like and download tracking
- [x] PWA with offline support
- [x] Full accessibility
- [x] SEO optimization
- [x] Analytics integration
- [x] AdSense integration

### Potential Improvements

- [ ] More sound effects
- [ ] Internationalization (i18n)
- [ ] User profiles and authentication
- [ ] Sound remix/mashup feature
- [ ] Undo/redo for edits
- [ ] QR code sharing for easier mobile-to-PC transfer
