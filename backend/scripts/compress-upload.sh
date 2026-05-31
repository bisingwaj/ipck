#!/usr/bin/env bash
# Compresse les MP4 > 50 Mo sous le plafond Supabase Free puis les téléverse.
set -u
BIN="/c/Users/DAVID KING/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin"
FF="$BIN/ffmpeg"; FP="$BIN/ffprobe"
SRC="c:/Users/DAVID KING/Desktop/IPCK-APP/backend/media/videos"
OUT="/tmp/ipck_vid"; mkdir -p "$OUT"
TARGET_MB=42

upload() { # name localfile
  python - "$1" "$2" << 'PY'
import os,sys,urllib.request
U=os.environ['SB_URL']; K=os.environ['SB_KEY']; name=sys.argv[1]; f=sys.argv[2]
data=open(f,'rb').read()
h={'Authorization':'Bearer '+K,'apikey':K,'Content-Type':'video/mp4','x-upsert':'true'}
r=urllib.request.Request(U+'/storage/v1/object/videos/'+name,data=data,headers=h,method='POST')
try:
    resp=urllib.request.urlopen(r,timeout=600); print('  upload OK', name, len(data)//(1024*1024),'MB', resp.status)
except urllib.error.HTTPError as e: print('  upload FAIL', name, e.code, e.read().decode()[:150])
PY
}

# files to (re)compress: name:resolution
for entry in "sunday-service-live:360" "easter-service-04-17:360" "first-service-2023-11-12:144"; do
  name="${entry%%:*}"; res="${entry##*:}"
  src="$SRC/$name.mp4"; dst="$OUT/$name.mp4"
  [ -f "$src" ] || { echo "MANQUANT $src"; continue; }
  dur=$("$FP" -v error -show_entries format=duration -of default=nk=1:nw=1 "$src" 2>/dev/null); dur=${dur%.*}
  total=$(( TARGET_MB * 8192 / dur ))
  if [ "$total" -lt 120 ]; then audio=24; ac=1; else audio=48; ac=2; fi
  vid=$(( total - audio - 5 )); [ "$vid" -lt 24 ] && vid=24
  echo ">>> $name | ${dur}s | ${res}p | total ${total}k | video ${vid}k | audio ${audio}k"
  "$FF" -y -hide_banner -loglevel error -i "$src" \
    -vf "scale=-2:$res" -c:v libx264 -preset fast -b:v ${vid}k -maxrate ${vid}k -bufsize $(( vid * 2 ))k \
    -c:a aac -b:a ${audio}k -ac $ac -movflags +faststart "$dst"
  if [ -f "$dst" ]; then
    mb=$(du -m "$dst" | cut -f1); echo "  -> ${mb}MB"
    upload "$name.mp4" "$dst"
  else
    echo "  ECHEC encodage $name"
  fi
done
echo "=== TERMINE ==="
