#!/bin/sh
# Saves a Marble world's two splat files (light 150k + full) into art/trip/worlds/.
# sh places/get-world.sh <name> <light .spz url> <full .spz url>   (run from prototypes/greybox)
set -e
mkdir -p art/trip/worlds
curl -sf -o "art/trip/worlds/$1-150k.spz" "$2"
curl -sf -o "art/trip/worlds/$1-full.spz" "$3"
ls -la "art/trip/worlds/$1-150k.spz" "art/trip/worlds/$1-full.spz"
