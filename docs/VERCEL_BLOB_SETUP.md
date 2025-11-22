# Vercel Blob Storage Setup Guide

## Overview

The admin dashboard uses Vercel Blob for media uploads (images, audio, video).

## Setup Steps

### 1. Create Vercel Blob Store

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or create one)
3. Navigate to **Storage** tab
4. Click **Create Database** → Select **Blob**
5. Give it a name (e.g., "waffles-media")
6. Click **Create**

### 2. Get API Token

After creating the Blob store:

1. You'll see environment variables displayed
2. Copy the `BLOB_READ_WRITE_TOKEN` value

### 3. Configure Environment Variables

**For Local Development** (`.env.local`):

```bash
# Vercel Blob Storage (Required for media uploads)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXXXXXXXXXXXXX
```

**For Production** (Vercel Dashboard):

1. Go to Project Settings → Environment Variables
2. The token should already be set if you created the Blob store from your project
3. If not, add it manually

### 4. Restart Development Server

```bash
pnpm dev
```

## Supported File Types

### Images

- JPEG (`.jpg`,`.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)
- AVIF (`.avif`)

### Audio

- MP3 (`.mp3`)
- WAV (`.wav`)
- OGG (`.ogg`)
- AAC (`.aac`)
- MP4 Audio (`.m4a`)
- WebM Audio (`.webm`)

### Video

- MP4 (`.mp4`)
- WebM (`.webm`)
- QuickTime (`.mov`)
- AVI (`.avi`)

## Using the Media Upload

### From Question Forms

1. Go to `/admin/games/[id]/questions`
2. Fill in question details
3. Click "Upload Image" or "Upload Audio" in the media sections
4. Select file → Upload automatically
5. Preview appears when upload completes
6. URL is saved with the question

### From Media Library

1. Go to `/admin/media`
2. View all uploaded files
3. Filter by type (Images/Audio/Videos)
4. Copy URLs for use
5. Delete unused files

## File Size Limits

- **Images**: 5MB max (configurable)
- **Audio**: 10MB max (configurable)
- **Videos**: 10MB max (configurable)

To change limits, edit the `MediaUpload` component's `maxSizeMB` prop.

## Troubleshooting

### Uploads Fail Silently

- Check that `BLOB_READ_WRITE_TOKEN` is set in `.env.local`
- Verify token is correct (starts with `vercel_blob_rw_`)
- Check console for errors

### "Unauthorized" Error

- Ensure you're logged in as admin
- Upload API requires admin session

### File Too Large

- Check file size against limits
- Compress file before uploading
- Adjust `maxSizeMB` if needed

### Unsupported File Type

- Verify file type is in allowed list
- Check file extension matches actual type
- Add type to `/api/upload/route.ts` if needed

## Cost Considerations

Vercel Blob pricing (as of 2024):

- **Storage**: $0.15/GB per month
- **Bandwidth**: $0.15/GB
- **Writes**: $0.05 per 1000 writes

**Typical usage**:

- 100 questions with images = ~50MB = $0.01/month storage
- 1000 views = ~5GB bandwidth = $0.75

## Alternative Storage Options

If you prefer not to use Vercel Blob, you can modify the upload system to use:

- AWS S3
- Cloudinary
- Local file storage (dev only)
- Any S3-compatible service

Contact an admin to implement alternative storage.
