import { mkdir, copyFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
const src = resolve('node_modules/@ffmpeg/core/dist/umd');
const dest=resolve('public/ffmpeg');
await mkdir(dest,{recursive:true});
for (const file of ['ffmpeg-core.js','ffmpeg-core.wasm']) {
  await stat(resolve(src,file));
  await copyFile(resolve(src,file),resolve(dest,file));
  console.log('Copied',file);
}
