#!/bin/sh
# Takes several downloaded paintings at once and warns if any two downloads are identical.
# sh places/take-many.sh <name> [<name> ...]   (run from prototypes/greybox; paintings come from $PAINT_IN, default ~/Downloads)
PAINT_IN=${PAINT_IN:-$HOME/Downloads}; export PAINT_IN
d=$(cd "$PAINT_IN" && md5sum IH-*.png | awk '{print $1}' | sort | uniq -d | wc -l)
[ "$d" != "0" ] && echo "WARNING: $d repeated downloads" && (cd "$PAINT_IN" && md5sum IH-*.png | awk '{print $1}' | sort | uniq -d | while read h; do md5sum IH-*.png | grep $h; done)
for w in "$@"; do sh places/take-painting.sh "$w"; done
echo "$(ls art/trip/*.webp | wc -l) paintings"
