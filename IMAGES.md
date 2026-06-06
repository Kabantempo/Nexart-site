# Images Optimization Guide

## Current Status

- ✅ **Lazy loading** implemented on non-critical images
- ✅ **next/image** used for LCP-critical images (avatars, portfolio, event covers)
- ✅ **External images** (Unsplash, Pravatar) served via CDN
- ⚠️ **WebP/AVIF** conversion not yet implemented

## WebP/AVIF Conversion

### For Self-Hosted Images

If you add self-hosted images to `/public/images/`, convert them to WebP/AVIF:

```bash
# Install ImageMagick
brew install imagemagick  # macOS
apt-get install imagemagick  # Ubuntu
choco install imagemagick  # Windows

# Convert to WebP (85% quality)
convert input.jpg -quality 85 output.webp

# Convert to AVIF (Recommended for modern browsers)
cwebp -q 85 input.jpg -o output.webp
```

### Using Next.js Image Component

```tsx
import Image from 'next/image'

<Image
  src="/images/example.webp"
  alt="Example"
  width={600}
  height={400}
  priority={false}
  loading="lazy"
/>
```

### Using Picture Element (Fallback)

```tsx
<picture>
  <source srcSet="/images/example.avif" type="image/avif" />
  <source srcSet="/images/example.webp" type="image/webp" />
  <img src="/images/example.jpg" alt="Example" />
</picture>
```

## External Images (Unsplash, Pravatar)

These are already optimized and served via CDN. No action needed.

## Browser Support

| Format | Support | Size Reduction |
|--------|---------|-----------------|
| AVIF | Chrome 88+, Firefox 93+ | 25-35% |
| WebP | Chrome 23+, Firefox 65+ | 25-30% |
| JPEG | All browsers | Baseline |

## Tools

- [Squoosh](https://squoosh.app/) — Browser-based converter
- [ImageMagick](https://imagemagick.org/) — CLI tool
- [FFmpeg](https://ffmpeg.org/) — Video/image encoding

## Performance Impact

- AVIF reduces average image size by **30%**
- WebP reduces by **25%**
- With lazy loading, improves Core Web Vitals scores
