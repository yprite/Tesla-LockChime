# Tesla Lock Sound Creator

A free web-based tool that allows Tesla owners to create custom lock chime sounds and save them directly to a USB drive.

## Features

- **100% Free** - No payments, no subscriptions, no accounts required
- **Browser-Based** - No software installation needed
- **Direct USB Save** - Save directly to USB drive using File System Access API
- **Audio Preview** - Listen to sounds before saving
- **Visual Waveform Editor** - Trim audio with intuitive drag handles
- **Tesla-Optimized Output** - Generates properly formatted WAV files

## Requirements

### Browser Support

| Browser | Support |
|---------|---------|
| Chrome (Desktop) | ✅ Supported |
| Edge (Desktop) | ✅ Supported |
| Safari | ❌ Not Supported |
| Firefox | ❌ Not Supported |
| Mobile Browsers | ❌ Not Supported |

This tool requires the **File System Access API** which is only available in Chromium-based browsers on desktop computers.

### Tesla Requirements

- Tesla vehicle with Boombox feature (Model S, 3, X, Y with external speaker)
- USB drive formatted as FAT32 or exFAT
- Software version that supports custom lock sounds

## How It Works

### User Flow

1. **Visit the Website** - Open in Chrome or Edge on a desktop PC
2. **Select a Sound** - Choose from pre-made chime sounds
3. **Trim the Audio** - Adjust to 2-5 seconds using the waveform editor
4. **Save to USB** - Click "Save to USB Drive" and select your USB drive
5. **Use in Tesla** - Follow on-screen instructions to enable in your Tesla

### Tesla Setup Instructions

1. Safely eject the USB drive from your computer
2. Plug the USB drive into your Tesla's USB port
3. On the touchscreen, go to **Toybox**
4. Select **Boombox**
5. Tap **Lock Sound**
6. Choose **USB** to use your custom sound

## Technical Details

### Output File Specifications

| Property | Value |
|----------|-------|
| File Name | `LockChime.wav` |
| Format | WAV (PCM) |
| Channels | Mono |
| Sample Rate | 44.1 kHz |
| Bit Depth | 16-bit |
| Duration | 2-5 seconds |
| Max File Size | ~1 MB |

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Chrome/Edge)                 │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Web Audio │  │  Canvas     │  │ File System     │  │
│  │   API       │  │  Waveform   │  │ Access API      │  │
│  │             │  │             │  │                 │  │
│  │ • Generate  │  │ • Visualize │  │ • Save to USB   │  │
│  │ • Playback  │  │ • Trim UI   │  │ • Direct write  │  │
│  │ • Export    │  │             │  │                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key Technologies

- **Web Audio API** - Audio synthesis, playback, and processing
- **Canvas API** - Waveform visualization
- **File System Access API** - Direct file system writes
- **No Server Required** - All processing happens client-side

## Project Structure

```
Tesla-LockChime/
├── index.html          # Main HTML page
├── css/
│   └── styles.css      # Styling
├── js/
│   ├── app.js          # Main application logic
│   ├── audio-data.js   # Sound definitions & WAV encoder
│   ├── audio-processor.js  # Audio playback & export
│   ├── file-system.js  # File System Access API handler
│   └── waveform.js     # Waveform visualizer
└── README.md           # This file
```

## Development

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/Tesla-LockChime.git
   cd Tesla-LockChime
   ```

2. Serve the files locally (File System Access API requires HTTPS or localhost):
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve
   ```

3. Open `http://localhost:8000` in Chrome or Edge

### Deployment

This is a static site that can be deployed to any web hosting service:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Any static file host

**Note:** HTTPS is required for the File System Access API to work in production.

## Monetization

This tool is monetized through display advertising only:

- Header and footer ad placements
- No popups or interstitials
- Ads do not interfere with core functionality
- Google AdSense compatible

To enable ads, add your AdSense code to the `ad-header` and `ad-footer` div elements in `index.html`.

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Unsupported browser | Modal overlay with instructions |
| Mobile device | Modal overlay with PC requirement |
| User cancels save | Silent - no error message |
| Permission denied | Prompt to try again |
| Save fails | Offer fallback download option |
| Audio too short | Validation message, save button hidden |
| Audio too long | Validation message, save button hidden |

## License

MIT License - Feel free to use, modify, and distribute.

## Disclaimer

This tool is not affiliated with, endorsed by, or sponsored by Tesla, Inc. Tesla and the Tesla logo are trademarks of Tesla, Inc.

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

### Ideas for Future Improvements

- [ ] Upload custom audio files (with copyright disclaimer)
- [ ] More pre-made sounds
- [ ] Audio effects (fade in/out, normalization)
- [ ] Multiple language support
- [ ] PWA support for offline use
