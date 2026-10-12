import React, {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {FFmpeg} from '@ffmpeg/ffmpeg';
import {fetchFile, toBlobURL} from '@ffmpeg/util';
import {UploadCloud, Film, Download, Settings2, ShieldCheck, Zap, RotateCcw, CheckCircle2, AlertCircle, FileVideo, LoaderCircle} from 'lucide-react';
import './style.css';
const CORE='/ffmpeg';
const fmt=n=>n<1024*1024?`${(n/1024).toFixed(1)} KB`:`${(n/1024/1024).toFixed(1)} MB`;
function App(){
 const ff=useRef(null), input=useRef(null), inputURL=useRef(null), outputURL=useRef(null), job=useRef(0), busy=useRef(false);
 const logs=useRef([]); const [details,setDetails]=useState(''); const [file,setFile]=useState(null),[source,setSource]=useState(''),[result,setResult]=useState(''),[resultSize,setResultSize]=useState(0),[ratio,setRatio]=useState('9:16'),[quality,setQuality]=useState('maximum'),[fps,setFps]=useState('source'),[status,setStatus]=useState('idle'),[progress,setProgress]=useState(0),[message,setMessage]=useState(''),[duration,setDuration]=useState(0),[drag,setDrag]=useState(false);
 useEffect(()=>()=>{if(inputURL.current)URL.revokeObjectURL(inputURL.current);if(outputURL.current)URL.revokeObjectURL(outputURL.current);if(ff.current)ff.current.terminate();},[]);
 const clearOutput=()=>{if(outputURL.current)URL.revokeObjectURL(outputURL.current);outputURL.current=null;setResult('');setResultSize(0);setProgress(0);setMessage('');setStatus('idle');setDetails('')};
 const selectFile=f=>{if(!f)return;if(!f.type.startsWith('video/')&&!/\.(mp4|mov|webm|mkv|m4v)$/i.test(f.name)){setMessage('Sila pilih fail video yang sah.');setStatus('error');return;}if(inputURL.current)URL.revokeObjectURL(inputURL.current);clearOutput();inputURL.current=URL.createObjectURL(f);setSource(inputURL.current);setFile(f);setDuration(0);};
  const load=async()=>{
   if(ff.current?.loaded)return ff.current;
   setStatus('loading');setMessage('Memeriksa dan memuatkan FFmpeg Core...');
   const base=new URL('ffmpeg/',window.location.origin+import.meta.env.BASE_URL).href;
   const corePath=new URL('ffmpeg-core.js',base).href;
   const wasmPath=new URL('ffmpeg-core.wasm',base).href;
   for(const path of [corePath,wasmPath]){
    const response=await fetch(path,{cache:'no-store'});
    const type=response.headers.get('content-type')||'';
    if(!response.ok||type.includes('text/html'))throw new Error(`Core asset tidak sah: ${path}; HTTP ${response.status}; Content-Type ${type}`);
   }
   // Direct same-origin URLs first. Some browsers / CSP settings reject blob imports.
   // Fall back to the FFmpeg.wasm documented Blob URL method.
   const attempts=[
    {name:'same-origin',get:async()=>({coreURL:corePath,wasmURL:wasmPath})},
    {name:'blob',get:async()=>({coreURL:await toBlobURL(corePath,'text/javascript'),wasmURL:await toBlobURL(wasmPath,'application/wasm')})}
   ];
   const failures=[];
   for(const attempt of attempts){
    const engine = new FFmpeg();
    engine.on('progress',({progress:p})=>{if(busy.current&&Number.isFinite(p))setProgress(Math.max(0,Math.min(99,Math.round(p*100))))});
    engine.on('log',({message:m})=>{logs.current.push(m);if(logs.current.length>35)logs.current.shift()});
    try{
     setMessage(`Memuatkan FFmpeg (${attempt.name})...`);
     const urls=await attempt.get();
     await engine.load(urls);
     ff.current=engine;
     return engine;
    }catch(error){
     failures.push(`${attempt.name}: ${error?.stack||error?.message||String(error)}`);
     try{engine.terminate()}catch{}
    }
   }
   throw new Error('FFmpeg Core gagal dimuatkan melalui kedua-dua kaedah.\n'+failures.join('\n\n')+'\nSemak Chrome DevTools > Console dan Network untuk ralat Worker, CSP atau MIME.');
  };
 const run=async()=>{if(!file||busy.current)return;busy.current=true;const id=++job.current;clearOutput();logs.current=[];setStatus('loading');let engine,srcName='input'+(file.name.match(/\.[^.]+$/)?.[0]||'.mp4'),outName='optimized.mp4';try{engine=await load();setStatus('processing');setMessage('Sedang mengoptimumkan video di dalam browser...');await engine.writeFile(srcName,await fetchFile(file));const [w,h]=ratio==='9:16'?[1080,1920]:ratio==='1:1'?[1080,1080]:[1920,1080];const scale=`scale=w=${w}:h=${h}:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=bicubic,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`;
 const crf={maximum:'18',balanced:'22',small:'26'}[quality];const args=['-nostdin','-threads','1','-i',srcName,'-map','0:v:0','-map','0:a?','-vf',scale];if(fps!=='source')args.push('-r',fps);args.push('-c:v','libx264','-preset','ultrafast','-crf',crf,'-pix_fmt','yuv420p','-profile:v','high','-movflags','+faststart','-threads','1','-c:a','aac','-b:a','192k','-ar','48000','-max_muxing_queue_size','1024',outName);
 const code=await engine.exec(args);if(code!==0)throw new Error('FFmpeg berhenti dengan kod '+code+'. Semak log diagnostik di bawah.');const data=await engine.readFile(outName);if(id!==job.current)return;const blob=new Blob([data],{type:'video/mp4'});outputURL.current=URL.createObjectURL(blob);setResult(outputURL.current);setResultSize(blob.size);setProgress(100);setStatus('done');setMessage(blob.size>file.size?'Kualiti maksimum dikekalkan, tetapi fail output lebih besar. Cuba mod Balanced untuk saiz lebih kecil.':'Video siap! Semak preview sebelum muat naik ke TikTok.');}catch(e){console.error(e);setStatus('error');setMessage(e?.message||'Encoding gagal. Sila semak log diagnostik.');setDetails([String(e),...logs.current.slice(-18)].join('\n')); }finally{busy.current=false;if(engine){try{await engine.deleteFile(srcName)}catch{}try{await engine.deleteFile(outName)}catch{}}}};
 const reset=()=>{if(busy.current){job.current++;ff.current?.terminate();ff.current=null;busy.current=false;}if(inputURL.current)URL.revokeObjectURL(inputURL.current);inputURL.current=null;setSource('');setFile(null);clearOutput();if(input.current)input.current.value='';};
 return <div className="app"><header><div className="brand"><span className="brand-icon"><Film size={22}/></span><span>J <b>— VIDEO OPTIMIZER</b><small>CREATOR STUDIO / 01</small></span></div><span className="privacy"><ShieldCheck size={16}/> 100% LOCAL PROCESSING</span></header><main><div className="hero"><span className="eyebrow"><i/> THE CREATOR'S TOOLKIT</span><h1>Every frame.<br/><em>Pixel perfect.</em></h1><p>Compress & optimize your videos for TikTok, without uploading them to a server. Maximum visual quality, full creative control.</p></div><div className="workspace"><section className="panel"><div className="panel-head"><span className="step">01</span><div><h2>Source video</h2><p>Upload your original footage</p></div></div><div className={'drop '+(drag?'drag':'')} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);selectFile(e.dataTransfer.files[0])}} onClick={()=>input.current?.click()}><input ref={input} type="file" accept="video/*,.mkv" hidden onChange={e=>selectFile(e.target.files?.[0])}/>{file?<><FileVideo size={33} className="gold"/><strong>{file.name}</strong><span>{fmt(file.size)} · Click to replace</span></>:<><UploadCloud size={38} className="gold"/><strong>Drop your video here</strong><span>or click to browse your files</span><small>MP4, MOV, WebM, MKV · File limits depend on browser memory</small></>}</div>{source&&<div className="preview"><div className="section-label">ORIGINAL PREVIEW</div><video src={source} controls playsInline preload="metadata" onLoadedMetadata={e=>setDuration(e.currentTarget.duration)}/><div className="meta"><span>{fmt(file.size)}</span><span>{duration?`${duration.toFixed(1)} sec`:'Video loaded'}</span></div></div>}</section><section className="panel"><div className="panel-head"><span className="step">02</span><div><h2>Output settings</h2><p>Fine-tune your export</p></div><Settings2 size={20} className="muted"/></div><div className="section-label">PLATFORM PRESET</div><div className="preset"><Zap size={20}/><span><b>TikTok Ready</b><small>H.264 · AAC · MP4</small></span><CheckCircle2 size={19}/></div><div className="section-label">ASPECT RATIO</div><div className="choices">{[['9:16','Vertical'],['1:1','Square'],['16:9','Wide']].map(([value,label])=><button key={value} className={ratio===value?'active':''} onClick={()=>setRatio(value)}><b>{value}</b><small>{label}</small></button>)}</div><div className="section-label">COMPRESSION QUALITY</div><div className="qualities">{[['maximum','Maximum Quality','CRF 18 · Sharpest output'],['balanced','Balanced','CRF 22 · Smaller size'],['small','Small File','CRF 26 · Strong compression']].map(([value,label,desc])=><label key={value} className={quality===value?'selected':''}><input type="radio" name="quality" checked={quality===value} onChange={()=>setQuality(value)}/><span><b>{label}</b><small>{desc}</small></span></label>)}</div><div className="section-label">FRAME RATE</div><select value={fps} onChange={e=>setFps(e.target.value)}><option value="source">Keep original FPS</option><option value="24">24 FPS</option><option value="30">30 FPS</option><option value="60">60 FPS</option></select><button className="primary" disabled={!file||busy.current} onClick={run}>{busy.current?<><LoaderCircle size={19} className="spin"/> Processing...</>:<><Zap size={19}/> COMPRESS & OPTIMIZE</>}</button><p className="hint">Your video stays on your device. First run downloads the encoding engine.</p></section></div><section className="result panel"><div className="panel-head"><span className="step">03</span><div><h2>Export & download</h2><p>Your optimized video will appear here</p></div>{file&&<button className="reset" onClick={reset}><RotateCcw size={15}/> Reset</button>}</div>{(status==='loading'||status==='processing'||status==='done')&&<div className="progress"><div className="progress-info"><span>{status==='loading'?'Loading encoder':status==='processing'?'Encoding video':'Complete'}</span><b>{progress}%</b></div><div className="track"><div style={{width:`${progress}%`}}/></div></div>}{message&&<div className={'notice '+(status==='error'?'error':'')}><AlertCircle size={17}/>{message}</div>}{status==='error'&&<details className="notice"><summary>Lihat log diagnostik FFmpeg</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:12}}>{details}</pre></details>}{result?<div className="finished"><video src={result} controls playsInline/><div className="stats"><div><small>ORIGINAL</small><b>{fmt(file.size)}</b></div><div><small>OPTIMIZED</small><b>{fmt(resultSize)}</b></div><div><small>SIZE CHANGE</small><b>{Math.round((1-resultSize/file.size)*100)}%</b></div></div><a className="download" href={result} download={(file.name.replace(/\.[^.]+$/,'')||'video')+'-tiktok-optimized.mp4'}><Download size={19}/> DOWNLOAD MP4</a></div>:<div className="empty"><Download size={26}/><span>Output preview and download will appear here</span></div>}</section><footer>J — VIDEO OPTIMIZER <span>BUILT FOR CREATORS · POWERED BY FFMPEG.WASM</span></footer></main></div>;
}
createRoot(document.getElementById('root')).render(<App/>);
