import { mkdir, copyFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('node_modules/@ffmpeg/core/dist/esm');
const target = resolve('public/ffmpeg');
await mkdir(target, { recursive: true });
for (const name of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  const from = resolve(source, name);
  const info = await stat(from);
  if (!info.isFile()) throw new Error(`Missing FFmpeg ESM asset: ${from}`);
  await copyFile(from, resolve(target, name));
  console.log(`Copied ESM ${name} (${info.size} bytes)`);
}
