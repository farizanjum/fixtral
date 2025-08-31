# Public Assets Folder

This folder contains essential static assets for the Fixtral application.

## 📁 File Structure

```
public/
├── bg.mp4                          # Background video for hero section
├── og-image.jpg                    # Open Graph preview image (1200x630)
├── favicon.ico                     # Main favicon for browser tabs
├── site.webmanifest               # PWA manifest
├── browserconfig.xml              # Windows tile configuration
└── README.md                      # This file
```

## 🎨 Favicon Setup

### Required Favicon File:
1. **`favicon.ico`** - Main favicon (works for all browsers)

### How to Create Favicon:
1. Start with a high-quality square image (at least 32x32px, ideally 256x256px)
2. Use online favicon generators like:
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   - [Favicon.io](https://favicon.io/)
3. Generate favicon.ico format
4. Replace the placeholder favicon.ico in this folder

## 🖼️ Open Graph Image (Preview Image)

### File: `og-image.jpg`
- **Dimensions**: 1200x630px (1.91:1 aspect ratio)
- **Format**: JPG or PNG
- **File Size**: Under 1MB recommended
- **Content**: Should showcase Fixtral branding and features

### When it's used:
- Facebook shares
- LinkedIn posts
- Twitter cards
- Discord embeds
- Other social media platforms

### Design Tips:
- Use high-contrast text for readability
- Include Fixtral logo prominently
- Show key features or benefits
- Use brand colors (black background, white text)
- Keep it clean and professional

## 🎬 Background Video Setup

### File: `bg.mp4`
- **Format**: MP4 (H.264 codec recommended)
- **Resolution**: 1920x1080 (Full HD) or higher
- **Duration**: 10-30 seconds (videos loop automatically)
- **File Size**: Keep under 10MB for optimal loading
- **Content**: Should complement Fixtral branding

### Video Requirements:
- **Codec**: H.264 for maximum compatibility
- **Frame Rate**: 24-30fps
- **Audio**: Optional (will be muted anyway)
- **Aspect Ratio**: 16:9 recommended

### Optimization Tips:
1. **Compress** using HandBrake or Adobe Media Encoder
2. **Test on mobile** devices for smooth playback
3. **Use short loops** if original is too long
4. **Consider creating multiple versions** for different devices

## 📱 PWA & Mobile Setup

### `site.webmanifest`
- Configures Progressive Web App behavior
- Defines app icons for mobile devices
- Sets theme colors and display mode

### `browserconfig.xml`
- Windows tile configuration
- Sets tile colors and icons for Windows devices

## 🔧 Next Steps

1. **Replace placeholder files** with your actual favicon and images
2. **Update domain** in `layout.tsx` metadata (currently set to `https://fixtral.com`)
3. **Add verification codes** for Google Search Console, Bing Webmaster Tools, etc.
4. **Test social sharing** to ensure Open Graph image displays correctly
5. **Verify favicon** appears in browser tabs and bookmarks

## 📊 SEO & Social Media Impact

With proper setup, your site will:
- ✅ Display correct favicon in browser tabs
- ✅ Show attractive preview image when shared on social media
- ✅ Have proper mobile app-like experience
- ✅ Pass all SEO best practices
- ✅ Look professional across all platforms

## 🚀 Performance Tips

- **Compress images** before uploading
- **Use WebP format** for og-image if supported
- **Optimize video** for web delivery
- **Test loading times** on mobile connections
- **Verify file sizes** are reasonable

---

**Remember**: These files are automatically served from your domain root, so `/favicon.ico` becomes `https://yourdomain.com/favicon.ico`
