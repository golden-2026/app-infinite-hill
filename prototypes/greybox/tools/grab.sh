#!/usr/bin/env bash
# grab.sh <name>: renames the newest ChatGPT picture download from the last 3 minutes (not already HN-*) to $PAINT_IN/<name>.png
# PAINT_IN = the folder the browser saves to (default ~/Downloads)
PAINT_IN=${PAINT_IN:-$HOME/Downloads}
cd "$PAINT_IN"; f=$(find . -maxdepth 1 -name '*.png' -mmin -3 ! -name 'HN-*' -printf '%T@ %f\n' | sort -nr | head -1 | cut -d' ' -f2-)
[ -n "$f" ] && mv "$f" "$1.png" && echo "$1 <- $f" || echo "nothing new for $1"
