#!/usr/bin/env bash
# ENDURO 2026 CITY - abre o jogo em tela cheia (modo aplicativo), sem instalar nada.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
URL="file://$DIR/index3d.html"

open_app() {
  for b in google-chrome chromium chromium-browser microsoft-edge brave-browser; do
    if command -v "$b" >/dev/null 2>&1; then "$b" --app="$URL" --start-fullscreen; return 0; fi
  done
  # macOS
  if [ -d "/Applications/Google Chrome.app" ]; then
    open -a "Google Chrome" --args --app="$URL" --start-fullscreen; return 0
  fi
  if [ -d "/Applications/Microsoft Edge.app" ]; then
    open -a "Microsoft Edge" --args --app="$URL" --start-fullscreen; return 0
  fi
  return 1
}

open_app || {
  # fallback: navegador padrao
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"
  elif command -v open >/dev/null 2>&1; then open "$URL"
  else echo "Abra este arquivo no navegador: $DIR/index3d.html"; fi
}
