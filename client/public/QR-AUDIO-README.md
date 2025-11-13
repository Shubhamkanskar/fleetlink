# QR Audio Scanner Microsite

A simple, production-ready microsite that scans QR codes and plays audio messages.

## Features

- ✅ Single HTML file (no build process needed)
- ✅ Automatic camera initialization
- ✅ QR code detection using html5-qrcode library
- ✅ Audio playback on QR code detection
- ✅ Responsive design for mobile devices
- ✅ Modern, clean UI with smooth animations
- ✅ No backend required - completely static

## Usage

### Quick Start

1. **Deploy the file**: Upload `qr-audio.html` to any static hosting service (Vercel, Netlify, GitHub Pages, etc.)

2. **Access via QR code**: Create a QR code containing the URL to your deployed microsite

3. **Scan and play**: Users scan the QR code → opens the microsite → microsite scans another QR code → plays audio

### Deployment Options

**Option 1: Vercel (Next.js public folder)**
- The file is already in `/client/public/qr-audio.html`
- Access at: `https://your-domain.com/qr-audio.html`

**Option 2: Standalone hosting**
- Upload to any static hosting service
- Works with: Vercel, Netlify, GitHub Pages, AWS S3, etc.

**Option 3: Local testing**
- Open `qr-audio.html` directly in a browser (HTTPS required for camera access)
- Or use a local server: `npx serve client/public`

## Customizing Audio Files

The microsite uses an audio mapping system in the JavaScript code. To customize which audio plays for different QR codes:

```javascript
// Find this section in the HTML file (around line 211):
const audioMap = {
    'welcome': 'https://example.com/welcome-shubham.mp3',
    'abhishek': 'https://example.com/hello-abhishek.mp3',
    'default': 'https://example.com/default-message.mp3'
};
```

### How it works:

1. When a QR code is scanned, the microsite reads its content
2. It checks if the QR code content matches any key in `audioMap`
3. If matched, it plays the corresponding audio file
4. If no match, it plays the 'default' audio

### Example Setup:

**QR Code Content**: "welcome-shubham"
**Audio Played**: The URL mapped to 'welcome' key (partial match)

**QR Code Content**: "https://mysite.com?user=abhishek"
**Audio Played**: The URL mapped to 'abhishek' key (partial match)

**QR Code Content**: "anything-else"
**Audio Played**: The default audio file

### Hosting Your Audio Files:

You can host MP3 files on:
- **Cloud storage**: AWS S3, Google Cloud Storage, Cloudflare R2
- **CDN**: Cloudinary, imgix
- **GitHub**: Store in repository and use raw.githubusercontent.com URL
- **Your server**: Any HTTPS URL (HTTP not recommended for modern browsers)

**Important**: Audio files must be served over HTTPS and support CORS.

## QR Code Examples

### Example 1: Simple welcome message
```
Content: welcome
Audio: Plays welcome audio
```

### Example 2: Encoded URL
```
Content: https://myapp.com/user/shubham
Audio: Plays audio based on matching keywords
```

### Example 3: JSON payload
```
Content: {"user":"shubham","message":"welcome"}
Audio: Matches against the entire string
```

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Safari 14+
- ✅ Firefox 88+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Requirements**:
- HTTPS connection (required for camera access)
- Camera permissions granted
- JavaScript enabled

## Testing

### Test on your phone:
1. Start local server: `cd client/public && npx serve`
2. Use ngrok or similar to expose over HTTPS: `ngrok http 3000`
3. Create QR code with the ngrok URL
4. Scan with phone

### Create test QR codes:
- Online: [qr-code-generator.com](https://www.qr-code-generator.com/)
- CLI: `npm install -g qrcode-terminal && qrcode-terminal "your-url-here"`

## Troubleshooting

### Camera not working:
- Ensure HTTPS connection
- Check browser permissions
- Try on a different device/browser

### Audio not playing:
- Check audio URL is accessible and HTTPS
- Verify CORS headers on audio server
- Check browser console for errors
- Some browsers require user interaction before audio plays

### QR code not detected:
- Ensure good lighting
- Hold camera steady
- Try different distances from QR code
- Check QR code is not damaged or blurry

## Security Notes

- Camera access requires HTTPS
- No data is stored or transmitted (all client-side)
- Audio URLs are visible in source code
- Consider adding authentication if needed for sensitive content

## License

Part of the FleetLink project.
