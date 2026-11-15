#!/usr/bin/env bash
# paths: GB = prototypes/greybox (this script's parent folder); PAINT_IN = where saved paintings land (default ~/Downloads)
TOOLS=$(cd "$(dirname "$0")" && pwd); GB=$(dirname "$TOOLS"); REPO=$(cd "$GB/../.." && pwd)
PAINT_IN=${PAINT_IN:-$HOME/Downloads}
# kb-film.sh <film id> <download prefix> <clip names...>: turns $PAINT_IN/<prefix>1.png.. (ChatGPT paintings) into
# 8-second living-painting clips (slow push-in / pull-out / drift, alternating), 720x1280 h264 like enc-film.sh,
# with a first-frame .webp poster each.
id=$1; pre=$2; shift 2
O=$GB/art/sacred/$id/clips
mkdir -p "$O"; i=1
for name in "$@"; do
  src=$(ls "$PAINT_IN"/${pre}${i}.{png,webp,jpg} 2>/dev/null | head -1)
  # crop to 9:16, upscale for smooth sub-pixel motion
  pre_f="crop=min(iw\,ih*9/16):min(ih\,iw*16/9),scale=2160:3840,setsar=1"
  case $((i % 4)) in
    1) z="zoompan=z='1+0.12*on/240':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'";;            # push in
    2) z="zoompan=z='1.12-0.12*on/240':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'";;         # pull out
    3) z="zoompan=z='1.1':x='(iw-iw/zoom)*on/240':y='ih/2-(ih/zoom/2)'";;                    # drift right
    0) z="zoompan=z='1.04+0.08*on/240':x='iw/2-(iw/zoom/2)':y='(ih-ih/zoom)*(1-on/240)'";;  # rise up + push
  esac
  ffmpeg -v error -y -loop 1 -i "$src" -vf "$pre_f,$z:d=240:s=720x1280:fps=30,format=yuv420p" -frames:v 240 -c:v libx264 -crf 23 -preset slow -movflags +faststart "$O/$name.mp4" && \
  ffmpeg -v error -y -i "$O/$name.mp4" -frames:v 1 -q:v 80 "$O/$name.webp" && echo "$name $(du -k "$O/$name.mp4" | cut -f1)k"
  i=$((i+1))
done
