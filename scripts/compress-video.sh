#!/bin/bash

# Video Compression Script for Web
# Optimizes videos for fast web loading with good quality
#
# Usage: ./scripts/compress-video.sh input.mp4 [output.mp4]
#
# If no output is specified, creates input-optimized.mp4

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: ffmpeg is not installed${NC}"
    echo "Install with: brew install ffmpeg"
    exit 1
fi

# Check arguments
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 input.mp4 [output.mp4]${NC}"
    echo ""
    echo "Examples:"
    echo "  $0 video.mp4                  # Creates video-optimized.mp4"
    echo "  $0 video.mp4 compressed.mp4   # Creates compressed.mp4"
    exit 1
fi

INPUT="$1"
BASENAME="${INPUT%.*}"
EXTENSION="${INPUT##*.}"

# Output file
if [ -z "$2" ]; then
    OUTPUT="${BASENAME}-optimized.mp4"
else
    OUTPUT="$2"
fi

# Check if input exists
if [ ! -f "$INPUT" ]; then
    echo -e "${RED}Error: Input file '$INPUT' not found${NC}"
    exit 1
fi

# Get original size
ORIGINAL_SIZE=$(ls -lh "$INPUT" | awk '{print $5}')

echo -e "${YELLOW}Compressing video for web...${NC}"
echo "Input:  $INPUT ($ORIGINAL_SIZE)"
echo "Output: $OUTPUT"
echo ""

# Compress with ffmpeg
# - H.264 codec (best compatibility)
# - CRF 28 (good quality/size balance, lower = better quality)
# - faststart (metadata at start for instant web playback)
# - AAC audio at 96k (good for web)
ffmpeg -i "$INPUT" \
    -c:v libx264 \
    -crf 28 \
    -preset fast \
    -c:a aac \
    -b:a 96k \
    -movflags +faststart \
    "$OUTPUT" \
    -y

# Get new size
NEW_SIZE=$(ls -lh "$OUTPUT" | awk '{print $5}')

# Calculate reduction
ORIGINAL_BYTES=$(ls -l "$INPUT" | awk '{print $5}')
NEW_BYTES=$(ls -l "$OUTPUT" | awk '{print $5}')
REDUCTION=$(echo "scale=0; (1 - $NEW_BYTES / $ORIGINAL_BYTES) * 100" | bc)

echo ""
echo -e "${GREEN}✓ Compression complete!${NC}"
echo "Original: $ORIGINAL_SIZE"
echo "Compressed: $NEW_SIZE"
echo "Reduction: ${REDUCTION}%"
