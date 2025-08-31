# Public Assets Folder

## Background Video Setup

Place your background video file here as `bg.mp4`:

```
public/
├── bg.mp4          # Your background video (MP4 format)
└── README.md       # This file
```

## Video Requirements

- **Format**: MP4 (H.264 codec recommended)
- **Resolution**: 1920x1080 (Full HD) or higher for best quality
- **Duration**: 10-30 seconds (videos loop automatically)
- **File Size**: Keep under 10MB for optimal loading speed
- **Content**: Should complement the Fixtral branding and be suitable for autoplay

## Video Optimization Tips

1. **Compress the video** using tools like HandBrake or Adobe Media Encoder
2. **Use H.264 codec** for maximum browser compatibility
3. **Keep file size small** while maintaining quality
4. **Test on mobile devices** to ensure smooth playback
5. **Consider creating a shorter loop** if the original is too long

## How it Works

The video will:
- Auto-play when the page loads (muted)
- Loop continuously
- Cover the entire hero section background
- Have a dark overlay for text readability
- Be responsive on all screen sizes

## Fallback

If the video fails to load or the browser doesn't support it, users will see a fallback message: "Your browser does not support the video tag."
