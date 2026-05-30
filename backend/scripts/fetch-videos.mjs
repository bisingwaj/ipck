#!/usr/bin/env node
/**
 * Télécharge en local les vidéos de la chaîne IPCK (contenu dont l'église est
 * propriétaire) pour les auto-héberger et les lire sans dépendre de YouTube.
 *
 * Technique de scraping : yt-dlp (https://github.com/yt-dlp/yt-dlp).
 *   - macOS/Linux : `brew install yt-dlp`  ou  `pipx install yt-dlp`
 *   - Windows     : `winget install yt-dlp.yt-dlp`  ou  `choco install yt-dlp`
 *   - ffmpeg est recommandé (fusion vidéo+audio) : installez-le aussi.
 *
 * Usage :  node scripts/fetch-videos.mjs
 * Les fichiers sont écrits dans  backend/media/videos/<key>.mp4
 * et servis par l'API sur  /media/videos/<key>.mp4  (cf. main.ts).
 *
 * Idempotent : un fichier déjà présent est ignoré.
 *
 * Anti-bot YouTube : si vous voyez « Sign in to confirm you're not a bot »
 * (l'IP est temporairement limitée après plusieurs téléchargements), relancez
 * en passant les cookies de votre navigateur, p.ex. :
 *   YTDLP_COOKIES_FROM_BROWSER=chrome  node scripts/fetch-videos.mjs
 *   (valeurs : chrome | edge | firefox | brave | chromium)
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const outDir = join(root, 'media', 'videos');
const manifest = JSON.parse(readFileSync(join(here, 'videos.manifest.json'), 'utf-8'));

function hasYtDlp() {
  const r = spawnSync('yt-dlp', ['--version'], { encoding: 'utf-8' });
  return r.status === 0;
}

if (!hasYtDlp()) {
  console.error('❌ yt-dlp introuvable. Installez-le puis relancez.');
  console.error('   macOS/Linux : brew install yt-dlp   (ou pipx install yt-dlp)');
  console.error('   Windows     : winget install yt-dlp.yt-dlp');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

// MP4 progressif (audio+vidéo dans un seul fichier) → AUCUN ffmpeg requis.
// Astuce : si vous installez ffmpeg, vous pouvez viser le 720p en remplaçant par
//   'bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[ext=mp4][vcodec!=none][acodec!=none]/b'
const FORMAT = 'b[ext=mp4][vcodec!=none][acodec!=none]/18/b[ext=mp4]/b';

let ok = 0;
let skipped = 0;
let failed = 0;

for (const v of manifest) {
  const out = join(outDir, `${v.key}.mp4`);
  if (existsSync(out)) {
    console.log(`⏭️  ${v.key} déjà téléchargé`);
    skipped++;
    continue;
  }
  console.log(`⬇️  ${v.key}  (${v.title})`);
  try {
    const cookiesBrowser = process.env.YTDLP_COOKIES_FROM_BROWSER;
    const args = [
      '-f', FORMAT,
      '--merge-output-format', 'mp4',
      '--no-playlist',
      '--retries', '5',
      '--sleep-requests', '1', // un peu plus doux → limite les blocages anti-bot
      ...(cookiesBrowser ? ['--cookies-from-browser', cookiesBrowser] : []),
      '-o', out,
      `https://www.youtube.com/watch?v=${v.youtubeId}`,
    ];
    execFileSync('yt-dlp', args, { stdio: 'inherit' });
    ok++;
  } catch {
    console.error(`⚠️  Échec du téléchargement de ${v.key} (${v.youtubeId})`);
    failed++;
  }
}

console.log(`\n✅ Terminé — ${ok} téléchargé(s), ${skipped} ignoré(s), ${failed} échec(s).`);
console.log(`   Fichiers : ${outDir}`);
console.log('   Servis sur /media/videos/<key>.mp4');
