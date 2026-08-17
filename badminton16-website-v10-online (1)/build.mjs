import { access, readFile, writeFile } from 'node:fs/promises';

const indexPath = 'public/index.html';
await access(indexPath);
let html = await readFile(indexPath, 'utf8');

const adminScript = '<script src="admin-lock.js"></script>';

if (!html.includes(adminScript)) {
  html = html.replace(
    '<script src="app.js"></script>',
    `${adminScript}
  <script src="app.js"></script>`
  );

  await writeFile(indexPath, html, 'utf8');
}

console.log('KTV Badminton v11 admin lock: static files ready.');
