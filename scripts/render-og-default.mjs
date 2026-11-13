#!/usr/bin/env node
/**
 * Genera public/social/og-default.png (1200×630) — tarjeta tipográfica TEMPORAL para vistas previas
 * de WhatsApp/Open Graph cuando una edición aún no tiene imagen social aprobada.
 * No es un logo oficial. Uso: node scripts/render-og-default.mjs
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const font = (p) => `data:font/woff2;base64,${readFileSync(resolve('node_modules', p)).toString('base64')}`;
const html = `<!doctype html><html><head><style>
@font-face{font-family:Mast;src:url(${font('@fontsource/unifrakturmaguntia/files/unifrakturmaguntia-latin-400-normal.woff2')})}
@font-face{font-family:Head;font-weight:400 900;src:url(${font('@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2')})}
@font-face{font-family:HeadI;font-style:italic;src:url(${font('@fontsource-variable/playfair-display/files/playfair-display-latin-wght-italic.woff2')})}
@font-face{font-family:Sans;font-weight:100 900;src:url(${font('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')})}
html,body{margin:0;width:1200px;height:630px;background:#F5E8CC;color:#251F1B}
.f{box-sizing:border-box;width:1200px;height:630px;padding:48px 64px;display:flex;flex-direction:column;border:14px solid #251F1B;outline:3px solid #251F1B;outline-offset:-26px}
.top{display:flex;justify-content:space-between;font:700 18px Sans;letter-spacing:.2em;text-transform:uppercase;border-bottom:2px solid #251F1B;padding-bottom:10px}
.m{font:132px/1 Mast;text-align:center;white-space:nowrap;margin:52px 0 30px}
.dbl{border-top:6px double #251F1B}
.t{font:italic 38px HeadI;text-align:center;margin-top:26px}
.b{margin-top:auto;display:flex;justify-content:center;gap:18px;align-items:center}
.tag{background:#A73429;color:#FFF8EC;font:800 20px Sans;letter-spacing:.2em;padding:10px 18px}
.gold{border:4px double #8a6a22;color:#8a6a22;font:800 20px Sans;letter-spacing:.2em;padding:6px 14px;transform:rotate(-3deg)}
</style></head><body><div class="f">
<div class="top"><span>Filipenses 4:13</span><span>Sale los viernes</span></div>
<div class="m">El Corral Times</div><div class="dbl"></div>
<div class="t">“Noticias, dramas, memes y más caos del gallinero”</div>
<div class="b"><span class="tag">Periódico digital</span><span class="gold">Los Gallos Sin Planes</span></div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/social/og-default.png' });
await browser.close();
console.log('✓ public/social/og-default.png');
