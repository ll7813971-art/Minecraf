#!/usr/bin/env bash
# Empaqueta los dos packs en dist/BastonDeLaFuria.mcaddon
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist
zip -qr dist/BastonDeLaFuria.mcaddon FuriaBP FuriaRP
echo "Creado dist/BastonDeLaFuria.mcaddon"
