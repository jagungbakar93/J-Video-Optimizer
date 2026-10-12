# J — VIDEO OPTIMIZER v1.2

## Fix: failed to import ffmpeg-core.js

The FFmpeg core is **self-hosted**, not loaded from a third-party CDN. The build script copies `ffmpeg-core.js` and `ffmpeg-core.wasm` from `@ffmpeg/core` into `public/ffmpeg/`.

## Deploy to Netlify

1. Upload this project to a GitHub repository.
2. In Netlify: Import from Git, select the repository.
3. Build command: `npm run build`; publish directory: `dist`.
4. Deploy and open `https://YOUR-SITE.netlify.app/ffmpeg/ffmpeg-core.js` — it must load JavaScript, not a 404 or HTML.
5. Also check `/ffmpeg/ffmpeg-core.wasm` returns HTTP 200.
6. Clear browser cache / hard refresh and test with a short MP4.

## Local

```sh
npm install
npm run build
npm run preview
```

For local dev, run `npm run build` once first to copy the core, then `npm run dev`.

## Notes

- Videos remain on the user's device; the browser downloads the FFmpeg engine from the same site.
- Maximum Quality (CRF 18) is not lossless and may produce a larger output.
- Encoding high-resolution/long videos can exhaust browser memory.
- Browser must support WebAssembly.
- This version fixes a probable core loading problem; actual browser encoding must still be tested after deployment.


## v1.3 Core loader fix
Uses local `@ffmpeg/core` UMD assets copied at build and `toBlobURL` for worker-compatible loading. Asset HTTP status and content type checked before load. Deploy via GitHub import with Netlify build command `npm run build` and publish directory `dist`. Do NOT drag-and-drop source files to Netlify without building. Confirm `/ffmpeg/ffmpeg-core.js` and `/ffmpeg/ffmpeg-core.wasm` both return real assets, not HTML. FFmpeg.wasm is memory-intensive and cannot guarantee lossless compression.
