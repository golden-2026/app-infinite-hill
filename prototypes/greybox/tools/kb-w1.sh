#!/usr/bin/env bash
# paths: GB = prototypes/greybox (this script's parent folder); PAINT_IN = where saved paintings land (default ~/Downloads)
TOOLS=$(cd "$(dirname "$0")" && pwd); GB=$(dirname "$TOOLS"); REPO=$(cd "$GB/../.." && pwd)
PAINT_IN=${PAINT_IN:-$HOME/Downloads}
# kb-w1.sh <id>: turns $PAINT_IN/<id>-<n>.png into 8 s clips + webp posters in art/sacred/<id>/clips/,
# (picture list: tools/paint-lists/w1/<id>.json, or $PAINT_LISTS/w1/<id>.json) using each shot's own camera move (push, pull, pan-left, pan-right, tilt-up, drift, parallax, whip).
id=$1
S=${PAINT_LISTS:-$TOOLS/paint-lists}
O=$GB/art/sacred/$id/clips
mkdir -p "$O"
node -e "for(const p of require(process.argv[1]).pictures)console.log(p.name+' '+(p.move||'push'))" "$(cygpath -w $S/w1/$id.json)" | while read name move; do
  src=$(ls -t "$PAINT_IN"/${name}.png "$PAINT_IN"/${name}.webp "$PAINT_IN"/${name}.jpg 2>/dev/null | head -1)
  if [ -s "$O/$name.mp4" ]; then continue; fi
  if [ -z "$src" ]; then echo "missing $id $name"; continue; fi
  pre="crop=min(iw\,ih*9/16):min(ih\,iw*16/9),scale=2160:3840,setsar=1"
  c="iw/2-(iw/zoom/2)"; m="ih/2-(ih/zoom/2)"
  case $move in
    pull)      z="zoompan=z='1.16-0.16*on/240':x='$c':y='$m'";;
    pan-left)  z="zoompan=z='1.14':x='(iw-iw/zoom)*(1-on/240)':y='$m'";;
    pan-right) z="zoompan=z='1.14':x='(iw-iw/zoom)*on/240':y='$m'";;
    tilt-up)   z="zoompan=z='1.14':x='$c':y='(ih-ih/zoom)*(1-on/240)'";;
    drift)     z="zoompan=z='1.08+0.04*sin(on/40)':x='$c+30*sin(on/50)':y='$m+20*cos(on/60)'";;
    parallax)  z="zoompan=z='1.05+0.12*on/240':x='(iw-iw/zoom)*(0.3+0.4*on/240)':y='$m'";;
    whip)      z="zoompan=z='if(lt(on,20),1.4-0.3*on/20,1.1+0.06*(on-20)/220)':x='$c':y='$m'";;
    *)         z="zoompan=z='1+0.16*on/240':x='$c':y='$m'";;
  esac
  ffmpeg -nostdin -v error -y -loop 1 -i "$src" -vf "$pre,$z:d=240:s=720x1280:fps=30,format=yuv420p" -frames:v 240 -c:v libx264 -crf 23 -preset slow -movflags +faststart "$O/$name.mp4" && \
  ffmpeg -nostdin -v error -y -i "$O/$name.mp4" -frames:v 1 -q:v 80 "$O/$name.webp" && echo "made $id $name ($move)"
done
