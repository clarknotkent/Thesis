# PWA Icons Directory

This directory should contain PWA icons in the following sizes:

## Required Icons:
- `icon-72x72.png` (72x72 pixels)
- `icon-96x96.png` (96x96 pixels)
- `icon-128x128.png` (128x128 pixels)
- `icon-144x144.png` (144x144 pixels)
- `icon-152x152.png` (152x152 pixels)
- `icon-192x192.png` (192x192 pixels) - **Minimum for Android**
- `icon-384x384.png` (384x384 pixels)
- `icon-512x512.png` (512x512 pixels) - **Minimum for iOS**

## How to Generate Icons:

### Option 1: Online Generator (Recommended)
1. Visit: https://www.pwabuilder.com/imageGenerator
2. Upload your logo/icon (minimum 512x512px, square, PNG format)
3. Download the generated icon pack
4. Extract and copy all icons to this directory

### Option 2: Manual Creation
1. Create a 512x512px PNG with your logo
2. Use an image editing tool to resize to all required sizes
3. Ensure transparent background or white background
4. Save all sizes with the naming convention above

### Option 3: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first, then run:
convert source-icon.png -resize 72x72 icon-72x72.png
convert source-icon.png -resize 96x96 icon-96x96.png
convert source-icon.png -resize 128x128 icon-128x128.png
convert source-icon.png -resize 144x144 icon-144x144.png
convert source-icon.png -resize 152x152 icon-152x152.png
convert source-icon.png -resize 192x192 icon-192x192.png
convert source-icon.png -resize 384x384 icon-384x384.png
convert source-icon.png -resize 512x512 icon-512x512.png
```

## Design Guidelines:
- Use simple, recognizable design
- Avoid text (hard to read at small sizes)
- Use high contrast colors
- Test how it looks on light and dark backgrounds
- Consider using the medical cross or shield icon for healthcare theme

## Current Status:
⚠️ **Icons not yet generated** - Placeholder icons needed for full PWA functionality
