#!/usr/bin/env bash
# paths: GB = prototypes/greybox (this script's parent folder); PAINT_IN = where saved paintings land (default ~/Downloads)
TOOLS=$(cd "$(dirname "$0")" && pwd); GB=$(dirname "$TOOLS"); REPO=$(cd "$GB/../.." && pwd)
PAINT_IN=${PAINT_IN:-$HOME/Downloads}
# enc-film.sh <film id> <download prefix> <clip names...>: encodes $PAINT_IN/<prefix>1.mp4.. into the film's clips folder
# (720x1280 h264, no audio, faststart) with a first-frame .webp poster each.
id=$1; pre=$2; shift 2
O=$GB/art/sacred/$id/clips
mkdir -p "$O"; i=1
for name in "$@"; do
  ffmpeg -v error -y -i "$PAINT_IN/${pre}${i}.mp4" -an -vf scale=720:1280,format=yuv420p -c:v libx264 -crf 25 -preset slow -movflags +faststart "$O/$name.mp4" && \
  ffmpeg -v error -y -i "$O/$name.mp4" -frames:v 1 -q:v 80 "$O/$name.webp" && echo "$name $(du -k "$O/$name.mp4" | cut -f1)k"
  i=$((i+1))
done
