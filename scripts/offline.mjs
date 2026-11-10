import { mediaRange } from './media-ranges.mjs';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
const basePath = (process.env.EXPO_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const scope = `${basePath}/`;
const walk = (p) =>
  readdirSync(p, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(p, e.name)) : [join(p, e.name)],
  );
// Use the same prefix as Metro for the resources not managed by its bundler.
const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8'));
manifest.start_url = scope;
manifest.scope = scope;
manifest.icons = manifest.icons.map((icon) => ({
  ...icon,
  src: scope + icon.src.replace(/^\//, ''),
}));
writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));
let html = readFileSync('dist/index.html', 'utf8');
html = html.replace(/<link[^>]+rel="manifest"[^>]*>/g, '');
html = html.replace(
  '</head>',
  `<link rel="manifest" href="${scope}manifest.json"><link rel="icon" type="image/svg+xml" href="${scope}icon.svg"></head>`,
);
writeFileSync('dist/index.html', html);
// GitHub Pages serves these routes without a catch-all server or an HTTP 404.
for (const route of ['atelier', 'herbier', 'carte', 'boutique', 'parametres', 'aide', 'carnet']) {
  mkdirSync(`dist/${route}`, { recursive: true });
  writeFileSync(`dist/${route}/index.html`, html);
}
copyFileSync('dist/index.html', 'dist/404.html');
writeFileSync('dist/.nojekyll', '');
const assets = walk('dist')
  .filter((p) => !p.endsWith('.map') && !p.endsWith('sw.js'))
  .map((p) => scope + p.slice(5));
const essentialAssets = assets.filter(
  (p) => !p.includes('/expansion-') && !p.includes('/ecosystem-'),
);
const prefix = `color-world:${scope}:`;
const version = prefix + Date.now();
writeFileSync(
  'dist/sw.js',
  `const PREFIX=${JSON.stringify(prefix)},CACHE=${JSON.stringify(version)},ASSETS=${JSON.stringify(essentialAssets)},SCOPE=${JSON.stringify(scope)};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
${mediaRange.toString()}
async function serveCached(request) {
 const cached=await caches.match(request),header=request.headers.get('Range');
 if(cached&&header){
  const blob=await cached.blob(),range=mediaRange(header,blob.size);
  if(!range)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+blob.size}});
  const headers=new Headers(cached.headers);headers.delete('Content-Encoding');headers.set('Accept-Ranges','bytes');headers.set('Content-Range','bytes '+range.start+'-'+range.end+'/'+blob.size);headers.set('Content-Length',String(range.end-range.start+1));
  return new Response(blob.slice(range.start,range.end+1),{status:206,headers});
 }
 return cached||fetch(request).then(response=>{if(response.ok&&!header){const copy=response.clone();caches.open(CACHE).then(c=>c.put(request,copy)).catch(()=>{});}return response;}).catch(()=>request.mode==='navigate'?caches.match(SCOPE+'index.html'):Response.error());
}
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(SCOPE))return;e.respondWith(serveCached(e.request));});`,
);
console.log(`Offline: ${assets.length} resources, scope ${scope}`);
