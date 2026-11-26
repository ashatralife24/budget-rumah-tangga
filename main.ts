// Budget Rumah Tangga — entri make.fun best-household-budget-site.
// Entrypoint ini menyalin app/ (situs statis: HTML, CSS, data contoh, chart
// canvas, router hash) dan screenshots/ ke direktori output, lalu menulis
// dossier.json lewat pustaka vendor make.fun. Repo dan output dihitung dari
// lokasi file ini (import.meta.url), bukan dari direktori kerja saat perintah
// dijalankan, supaya grader bisa menjalankan `node main.ts` dari mana saja.
//
// Di luar grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
if (!existsSync(join(here, 'app'))) throw new Error('app/ is missing next to main.ts');
if (!existsSync(join(here, 'app', 'index.html'))) throw new Error('app/index.html is missing');
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 16 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 }),
);
