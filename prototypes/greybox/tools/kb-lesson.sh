#!/usr/bin/env bash
# paths: GB = prototypes/greybox (this script's parent folder); PAINT_IN = where saved paintings land (default ~/Downloads)
TOOLS=$(cd "$(dirname "$0")" && pwd); GB=$(dirname "$TOOLS"); REPO=$(cd "$GB/../.." && pwd)
PAINT_IN=${PAINT_IN:-$HOME/Downloads}
# kb-lesson.sh <lesson id>: for each picture in tools/paint-lists/lesson/<id>.json, turns $PAINT_IN/<clip name>.png (saved
# from ChatGPT) into an 8-second living-painting clip + .webp poster in art/sacred/<id>/clips/ (same moves as
# kb-film.sh). Skips clips already made and pictures not saved yet; prints what is still missing.
id=$1
S=${PAINT_LISTS:-$TOOLS/paint-lists}
O=$GB/art/sacred/$id/clips
mkdir -p "$O"; i=1
for name in $(node -e "for(const p of require(process.argv[1]).pictures)console.log(p.name)" "$(cygpath -w $S/lesson/$id.json)"); do
  src=$(ls "$PAINT_IN"/${name}.{png,webp,jpg} 2>/dev/null | head -1)
  if [ -s "$O/$name.mp4" ]; then i=$((i+1)); continue; fi
  if [ -z "$src" ]; then echo "missing $id $name"; i=$((i+1)); continue; fi
  pre_f="crop=min(iw\,ih*9/16):min(ih\,iw*16/9),scale=2160:3840,setsar=1"
  case $((i % 4)) in
    1) z="zoompan=z='1+0.12*on/240':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'";;
    2) z="zoompan=z='1.12-0.12*on/240':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'";;
    3) z="zoompan=z='1.1':x='(iw-iw/zoom)*on/240':y='ih/2-(ih/zoom/2)'";;
    0) z="zoompan=z='1.04+0.08*on/240':x='iw/2-(iw/zoom/2)':y='(ih-ih/zoom)*(1-on/240)'";;
  esac
  ffmpeg -v error -y -loop 1 -i "$src" -vf "$pre_f,$z:d=240:s=720x1280:fps=30,format=yuv420p" -frames:v 240 -c:v libx264 -crf 23 -preset slow -movflags +faststart "$O/$name.mp4" && \
  ffmpeg -v error -y -i "$O/$name.mp4" -frames:v 1 -q:v 80 "$O/$name.webp" && echo "made $id $name"
  i=$((i+1))
done
