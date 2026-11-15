#!/usr/bin/env bash
# paths: GB = prototypes/greybox (this script's parent folder); PAINT_IN = where saved paintings land (default ~/Downloads)
TOOLS=$(cd "$(dirname "$0")" && pwd); GB=$(dirname "$TOOLS"); REPO=$(cd "$GB/../.." && pwd)
PAINT_IN=${PAINT_IN:-$HOME/Downloads}
# sync-films.sh: copies every finished Hindu film page (page + clips poster present) and its art into the app's
# public/films folder (git-ignored), plus the world scenes the films use.
G=$GB
A=${FILMS_OUT:-$REPO/apps/app/public/films}
for id in ganesha-first broken-tusk valmiki no-effort universe first-letters milk rama ganga vibhishana gajendra markandeya squirrel krishna-morning parvati annapurna homecoming restless-mind ugadi new-clothes arjuna-dark narada visarjan kumbh ganesha-head ahalya holika durga; do
  [ -f "$G/$id-film.html" ] && [ -n "$(ls $G/art/sacred/$id/clips/*.webp 2>/dev/null)" ] && [ -n "$(ls $G/art/sacred/$id/voice/*.mp3 2>/dev/null)" ] || continue
  mkdir -p "$A/art/sacred/$id"; cp "$G/$id-film.html" "$A/"; cp -r "$G/art/sacred/$id/clips" "$G/art/sacred/$id/voice" "$A/art/sacred/$id/"; echo "synced $id"
done
cp "$G"/art/world/story-* "$G"/art/world/*-dusk.webp "$A/art/world/" 2>/dev/null; echo world ok
