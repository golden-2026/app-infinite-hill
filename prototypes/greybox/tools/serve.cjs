// tiny static server rooted at GB (HEAD supported, byte ranges for video), for local previews and QA walks only
// node tools/serve.cjs [root folder] [port]   (root defaults to prototypes/greybox, port to 8791)
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || path.dirname(__dirname), PORT = +process.argv[3] || 8791;
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary' };
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const f = path.join(ROOT, u); if (!f.startsWith(path.resolve(ROOT))) { res.writeHead(403); return res.end(); }
  fs.stat(f, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404); return res.end(); }
    const type = T[path.extname(f).toLowerCase()] || 'application/octet-stream', range = req.headers.range;
    if (range && /bytes=/.test(range)) {
      const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, en = b ? +b : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${s}-${en}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': en - s + 1 });
      if (req.method === 'HEAD') return res.end(); return fs.createReadStream(f, { start: s, end: en }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
    if (req.method === 'HEAD') return res.end(); fs.createReadStream(f).pipe(res);
  });
}).listen(PORT, () => console.log('serving', ROOT, PORT));
