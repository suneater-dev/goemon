# Goemon Assets Directory

This directory contains all media assets for the Goemon website.

## 📁 Current Structure

```
assets/
├── images/
│   ├── backgrounds/
│   │   └── hero-mountain.svg      # Traditional Japanese mountain landscape
│   ├── characters/
│   │   └── goemon-ninja.svg       # Main character illustration
│   └── icons/
│       └── logo-goemon.svg        # Brand logo and favicon
└── videos/                        # Video content (empty - ready for uploads)
```

## 🚀 Quick Start

### Adding New Images
1. Place images in the appropriate subdirectory:
   - `backgrounds/` - Landscape and background images
   - `characters/` - Character illustrations and avatars  
   - `icons/` - Logos, icons, and UI elements

2. Use the HTML pattern:
```html
<img src="./assets/images/[category]/[filename]" 
     alt="Descriptive alt text"
     class="lazy-image"
     loading="lazy">
```

### Adding Videos
1. Place video files in the `videos/` directory
2. Provide multiple formats (MP4 + WebM)
3. Keep file sizes under 5MB for web performance
4. Use this HTML pattern:
```html
<video autoplay muted loop playsinline>
    <source src="./assets/videos/[filename].mp4" type="video/mp4">
    <source src="./assets/videos/[filename].webm" type="video/webm">
</video>
```

## 🎨 Style Guidelines

### Traditional Japanese Aesthetic
- **Colors**: Warm beige, cream, traditional red (#CC2936), gold accents
- **Elements**: Mountains, cherry blossoms, Japanese calligraphy
- **Style**: Ukiyo-e inspired, minimalist, elegant

### Technical Requirements
- **Images**: SVG preferred, PNG/JPG as backup
- **Videos**: MP4 (H.264) primary, WebM (VP9) fallback
- **Dimensions**: See MEDIA-GUIDELINES.md for specifications

## 📄 Documentation

For complete media guidelines, optimization tips, and implementation examples, see:
- `../MEDIA-GUIDELINES.md` - Comprehensive media documentation

## ⚡ Current Assets

### Generated SVG Assets
All current images are hand-crafted SVG files optimized for:
- ✅ Fast loading
- ✅ Scalability 
- ✅ Traditional Japanese aesthetic
- ✅ Brand consistency

### Ready for Enhancement
The video directory is prepared for:
- Background animation videos
- Character animations
- Demo content
- Marketing videos

## 🛠️ Next Steps

1. **Replace SVG placeholders** with custom artwork
2. **Add video content** for enhanced user experience
3. **Optimize existing assets** for better performance
4. **Create additional characters** for the ecosystem