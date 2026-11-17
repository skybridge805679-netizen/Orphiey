// NovelAI V5 고급 기능 탐침: img2img · Precise Reference · Vibe 인코딩 · 인페인트가 어떤 요청 모양으로 통하는지 실제 API로 확인한다.
// GitHub Actions(nai-probe.yml)에서 NAI_TOKEN으로 돈다. 결과: tools/nai/log/probe.txt, 성공 이미지 assets/nai/probe/
// 공식 문서에 API가 없고 비공식 클라이언트끼리 갈리므로(JSON 인라인 base64 vs multipart), 후보를 차례로 보내 본다. 소량의 Anlas가 들 수 있다.
import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';import crypto from 'node:crypto';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..','..');
const P=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/nai/preset.json'),'utf8'));
const TOKEN=process.env.NAI_TOKEN;if(!TOKEN){console.error('NAI_TOKEN 없음');process.exit(1);}
const OUT=path.join(ROOT,'assets/nai/probe'),LOG=path.join(ROOT,'tools/nai/log/probe.txt');fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(path.dirname(LOG),{recursive:true});
const lines=[];const log=s=>{console.log(s);lines.push(s);};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SRC=fs.readFileSync(path.join(ROOT,'assets/nai/test/orpheia_sprite_s1001.png'));   // 832x1216 기준 그림(주인님 선택)
const B64=SRC.toString('base64');
// 1024x1536 캔버스에 가운데 정렬(Precise Reference는 큰 해상도 셋 중 하나로 패딩된다) — PNG를 다시 만들지 않고 원본도 그대로 시험한다
function unzip(buf){
 if(buf[0]===0x89&&buf[1]===0x50)return buf;
 let e=-1;for(let i=buf.length-22;i>=Math.max(0,buf.length-65557);i--)if(buf.readUInt32LE(i)===0x06054b50){e=i;break;}
 if(e<0)return null;let c=buf.readUInt32LE(e+16);
 for(let k=0;k<buf.readUInt16LE(e+10)&&buf.readUInt32LE(c)===0x02014b50;k++){const m=buf.readUInt16LE(c+10),cs=buf.readUInt32LE(c+20),nl=buf.readUInt16LE(c+28),xl=buf.readUInt16LE(c+30),cl=buf.readUInt16LE(c+32),lo=buf.readUInt32LE(c+42),name=buf.slice(c+46,c+46+nl).toString();
  if(/\.(png|webp)$/i.test(name)){const s=lo+30+buf.readUInt16LE(lo+26)+buf.readUInt16LE(lo+28),d=buf.slice(s,s+cs);return m===0?d:zlib.inflateRawSync(d);}c+=46+nl+xl+cl;}
 return null;
}
const prompt=P.prompt_prefix.trim().replace(/,\s*$/,'')+', 1girl, solo, visual novel sprite, full body, standing, looking at viewer, 2.1::transparent background::'+P.quality_suffix;
const charCap='girl, silver hair, very long hair, straight hair, sidelocks, green eyes, aqua ribbon, hair ribbon, maid, maid headdress, black dress, white apron, frilled apron, puffy short sleeves, wrist cuffs, green brooch, aqua ascot, white pantyhose';
function base(extra,seed=1001,model=P.model){
 const cap=charCap+', '+extra;
 return {input:prompt,model,action:'generate',parameters:{params_version:4,width:832,height:1216,scale:P.guidance,sampler:P.sampler,steps:P.steps,seed,n_samples:1,noise_schedule:'karras',cfg_rescale:0,
  qualityToggle:false,legacy:false,legacy_uc:false,add_original_image:true,negative_prompt:P.uc,
  v4_prompt:{caption:{base_caption:prompt,char_captions:[{char_caption:cap,centers:[{x:0.5,y:0.5}]}]},use_coords:false,use_order:true},
  v4_negative_prompt:{caption:{base_caption:P.uc,char_captions:[{char_caption:'garter straps',centers:[{x:0.5,y:0.5}]}]},legacy_uc:false}}};
}
// multipart: JSON은 request 파트, 이미지 필드는 파트 이름으로 바꾼다(웹 클라이언트 방식, LlmKira 코드 기준)
const secret=crypto.randomBytes(32);const key=b=>crypto.createHmac('sha256',secret).update(b).digest('hex');
function multipart(body,images){
 const boundary='----WebKitFormBoundary'+crypto.randomBytes(8).toString('hex'),parts=[];
 const add=(name,type,data,filename)=>parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"${filename?`; filename="${filename}"`:''}\r\nContent-Type: ${type}\r\n\r\n`),data,Buffer.from('\r\n'));
 add('request','application/json',Buffer.from(JSON.stringify(body)));
 for(const [name,buf] of images)add(name,'image/png',buf,'blob');
 parts.push(Buffer.from(`--${boundary}--\r\n`));
 return {body:Buffer.concat(parts),type:'multipart/form-data; boundary='+boundary};
}
async function send(label,url,body,images){
 await sleep(6000);
 let opts;
 if(images){const m=multipart(body,images);opts={method:'POST',headers:{Authorization:'Bearer '+TOKEN,'Content-Type':m.type},body:m.body};}
 else opts={method:'POST',headers:{Authorization:'Bearer '+TOKEN,'Content-Type':'application/json'},body:JSON.stringify(body)};
 for(let a=0;a<4;a++){
  const r=await fetch(url,opts);const buf=Buffer.from(await r.arrayBuffer());
  if(r.status===429){await sleep(15000*(a+1));continue;}
  if(!r.ok){log(`❌ ${label}: HTTP ${r.status} ${buf.toString('utf8').slice(0,300).replace(/\s+/g,' ')}`);return null;}
  const img=unzip(buf);
  if(img){const f=path.join(OUT,label.replace(/[^a-z0-9_-]/gi,'_')+'.png');fs.writeFileSync(f,img);log(`✅ ${label}: 이미지 ${img.length}B → ${path.relative(ROOT,f)}`);}
  else log(`✅ ${label}: 200, ${r.headers.get('content-type')} ${buf.length}B 앞부분 ${buf.slice(0,60).toString('base64')}`);
  return buf;
 }
 log(`❌ ${label}: 429 반복`);return null;
}
const GEN='https://image.novelai.net/ai/generate-image';
// ── 1. img2img (같은 그림에서 표정만: 놀람)
{const b=base('surprised, open mouth, wide-eyed');b.action='img2img';Object.assign(b.parameters,{strength:0.5,noise:0,extra_noise_seed:1001,color_correct:false});
 await send('i2i_json_inline',GEN,{...b,parameters:{...b.parameters,image:B64}});
 await send('i2i_multipart',GEN,{...b,parameters:{...b.parameters,image:'image',image_cache_secret_key:key(B64)}},[['image',SRC]]);}
// ── 2. Precise Reference (기준 그림의 인물로 다른 포즈)
for(const [mode,desc] of [['character','character'],['char_style','character&style']]){
 const b=base('surprised, open mouth, waving, sitting on chair',2468);
 const pr={director_reference_descriptions:[{caption:{base_caption:desc,char_captions:[]},legacy_uc:false}],director_reference_information_extracted:[1],director_reference_strength_values:[1],director_reference_secondary_strength_values:[0]};
 await send(`pref_${mode}_json`,GEN,{...b,parameters:{...b.parameters,...pr,director_reference_images:[B64]}});
 if(mode==='character')await send(`pref_${mode}_multipart`,GEN,{...b,parameters:{...b.parameters,...pr,director_reference_images_cached:[{cache_secret_key:key(B64),data:'ref0'}]}},[['ref0',SRC]]);
}
// ── 3. Vibe 인코딩
for(const body of [{image:B64,model:P.model,information_extracted:1},{image:B64,model:'nai-diffusion-4-5-full',information_extracted:1}])
 await send('vibe_encode_'+body.model,'https://image.novelai.net/ai/encode-vibe',body);
// ── 4. 인페인트: 아래 절반을 다시(흰색=다시 그림으로 가정, 반대도 시험)
{const W=832,H=1216;
 const png=(fill)=>{const raw=Buffer.alloc((W*1+1)*H);for(let y=0;y<H;y++){raw[y*(W+1)]=0;raw.fill(fill(y),y*(W+1)+1,(y+1)*(W+1));}
  const crc=b=>{let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}c=0xffffffff;for(const x of b)c=t[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
  const chunk=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c]);};
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=0;
  return Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);};
 const mask=png(y=>y>H/2?255:0);
 const b=base('holding a teacup and saucer',1001,P.model+'-inpainting');b.action='infill';
 await send('infill_json',GEN,{...b,parameters:{...b.parameters,image:B64,mask:mask.toString('base64')}});
 await send('infill_multipart',GEN,{...b,parameters:{...b.parameters,image:'image',image_cache_secret_key:key(B64),mask:'mask',mask_cache_secret_key:key(mask.toString('base64'))}},[['image',SRC],['mask',mask]]);
}
fs.writeFileSync(LOG,new Date().toISOString()+'\n'+lines.join('\n')+'\n');
