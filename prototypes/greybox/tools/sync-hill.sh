#!/usr/bin/env bash
# paths: GB = prototypes/greybox (this script's parent folder); PAINT_IN = where saved paintings land (default ~/Downloads)
TOOLS=$(cd "$(dirname "$0")" && pwd); GB=$(dirname "$TOOLS"); REPO=$(cd "$GB/../.." && pwd)
PAINT_IN=${PAINT_IN:-$HOME/Downloads}
# sync-hill.sh: copies the lesson player, hill app, lessons and every lesson's clips into atlas/expo-live130/hill (or $HILL_OUT).
G=$GB
H=${HILL_OUT:-$REPO/atlas/expo-live130/hill}
P='<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
for f in play.html hill-app.html; do { printf '%s\n' "$P"; cat "$G/$f"; } > "$H/$f"; done
mkdir -p "$H/lessons" "$H/art/store"; cp "$G"/lessons/*.json "$H/lessons/"; cp -r "$G"/art/store/. "$H/art/store/"; cp "$G/store-test.html" "$H/"
n=0; for f in "$G"/lessons/*.json; do d=$(node -e "console.log(require(process.argv[1]).clips)" "$(cygpath -w "$f")"); [ -d "$G/$d" ] || continue
  mkdir -p "$H/$d"; cp -u "$G/$d"*.mp4 "$G/$d"*.webp "$H/$d" 2>/dev/null; n=$((n+1)); done
echo "synced $n lesson clip folders"; du -sh "$H" | cut -f1
