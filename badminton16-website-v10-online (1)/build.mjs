import { access } from 'node:fs/promises';
await access('public/index.html');
console.log('KTV Badminton v10 online: static files ready.');
