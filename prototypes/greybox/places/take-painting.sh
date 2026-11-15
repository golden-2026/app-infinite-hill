#!/bin/sh
# Copies a ChatGPT painting from $PAINT_IN (default ~/Downloads) into the prototype (art/trip/<name>.webp) and makes a jpg for Marble upload.
# sh places/take-painting.sh <name> [<upload dir>]   (run from prototypes/greybox)
# upload dir: the jpg for Marble goes there; default $MARBLE_UP, else ${TMPDIR:-/tmp}/ih-marble-upload
set -e
PAINT_IN=${PAINT_IN:-$HOME/Downloads}
# the newest download wins (the browser saves a repeat name as "IH-<name> (1).png")
SRC=$(ls -t "$PAINT_IN"/IH-"$1".png "$PAINT_IN"/IH-"$1"\ \(*\).png 2>/dev/null | head -1)
UP="${2:-${MARBLE_UP:-${TMPDIR:-/tmp}/ih-marble-upload}}"
mkdir -p "$UP"
ffmpeg -y -loglevel error -i "$SRC" -q:v 82 "art/trip/$1.webp"
ffmpeg -y -loglevel error -i "$SRC" -q:v 2 "$UP/$1-src.jpg"
echo "$1: $(ffprobe -v error -show_entries stream=width,height -of csv=p=0 "$SRC")"
