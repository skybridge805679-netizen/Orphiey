// NovelAI V5 이미지 생성기 — GitHub Actions에서 저장소 시크릿 NAI_TOKEN으로 돈다(토큰은 로그·파일에 남기지 않는다).
// 실행: NAI_TOKEN=... node tools/nai/generate.mjs [작업파일...]   (인자가 없으면 tools/nai/jobs/*.json 전부)
//   --dry : 요청 본문만 출력하고 보내지 않는다(토큰 불필요)   --force : 이미 있는 출력도 다시 만든다
// 작업 파일 형식: { "jobs": [ { "out": "assets/nai/x.png", "size": "portrait"|"landscape"|"square"|[w,h],
//   "chars": ["orpheia"] 또는 [{"id":"orpheia","x":0.3,"y":0.5,"extra":"smile"}], "scene": "태그…", "uc": "추가 UC",
//   "chibi": false, "seed": 123 (없으면 무작위), "seeds": [1,2,3] (여러 장 → out 이름 뒤에 _s<시드>), "quality": true } ] }
// 기본값(모델·스텝·샘플러·화풍 앞머리·UC·품질 태그)은 tools/nai/preset.json.
import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..','..');
const P=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/nai/preset.json'),'utf8'));
const C=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/nai/characters.json'),'utf8'));
const args=process.argv.slice(2),DRY=args.includes('--dry'),FORCE=args.includes('--force');
const files=args.filter(a=>!a.startsWith('--'));
const jobFiles=files.length?files:fs.readdirSync(path.join(ROOT,'tools/nai/jobs')).filter(f=>f.endsWith('.json')).map(f=>path.join('tools/nai/jobs',f));
const TOKEN=process.env.NAI_TOKEN;
if(!DRY&&!TOKEN){console.error('NAI_TOKEN이 없습니다 (GitHub Actions 시크릿에서 넘겨야 합니다).');process.exit(1);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const join=(...xs)=>xs.map(x=>String(x||'').trim().replace(/^,|,$/g,'').trim()).filter(Boolean).join(', ');

function build(job,seed){
 const [width,height]=Array.isArray(job.size)?job.size:P.sizes[job.size||'portrait'];
 if(!job.init&&width*height>1024*1024)throw Error(`${job.out}: ${width}x${height}는 Opus 무료 범위(1MP)를 넘습니다`);
 const chars=(job.chars||[]).map(c=>typeof c==='string'?{id:c}:c).map(c=>{const d=C[c.id];if(!d)throw Error('모르는 인물: '+c.id);return {...c,d};});
 // 인원 태그(1girl, 2girls…)는 기본 프롬프트에, 인물 외형은 캐릭터 칸에 (V5 다인물 규칙)
 const girls=chars.filter(c=>/girl/.test(c.d.count)).length,boys=chars.filter(c=>/boy/.test(c.d.count)).length;
 const count=[girls?`${girls}girl${girls>1?'s':''}`:'',boys?`${boys}boy${boys>1?'s':''}`:'',chars.length===1?'solo':''];
 const base=(job.noPrefix?'':P.prompt_prefix.trim().replace(/,\s*$/,'')+', ')+join(...count,job.chibi?'chibi, visual novel chibi':'',job.scene)+(job.quality===false?'':P.quality_suffix);
 const uc=join(P.uc,job.uc);
 const many=chars.length>1;
 const char_captions=chars.map(c=>({char_caption:join(c.d.look,c.outfit??c.d.outfit,c.extra),centers:[{x:c.x??0.5,y:c.y??0.5}]}));
 const neg_captions=chars.map(c=>({char_caption:join(c.d.uc,c.uc),centers:[{x:c.x??0.5,y:c.y??0.5}]}));
 const body={input:base,model:P.model,action:'generate',parameters:{
  params_version:4,width,height,scale:P.guidance,sampler:P.sampler,steps:P.steps,seed,n_samples:1,
  noise_schedule:'karras',cfg_rescale:0,prefer_brownian:true,legacy:false,legacy_v3_extend:false,legacy_uc:false,
  qualityToggle:false,autoSmea:false,add_original_image:true,
  negative_prompt:uc,
  v4_prompt:{caption:{base_caption:base,char_captions},use_coords:many,use_order:true},
  v4_negative_prompt:{caption:{base_caption:uc,char_captions:neg_captions},legacy_uc:false},
 }};
 // img2img(실측 확인, V5 Full): 기준 그림에서 표정·옷만 바꾸는 차분. 크기는 기준 그림 크기. strength 0.5 ≈ 표정만, 0.65~0.7 ≈ 포즈·옷까지
 if(job.init){const img=fs.readFileSync(path.join(ROOT,job.init.image));
  Object.assign(body.parameters,{width:img.readUInt32BE(16),height:img.readUInt32BE(20),image:img.toString('base64'),strength:job.init.strength??0.5,noise:job.init.noise??0,extra_noise_seed:seed,color_correct:false});
  body.action='img2img';}
 return body;
}
// ZIP에서 첫 이미지 꺼내기 (의존성 없이: 로컬 파일 헤더 → stored/deflate)
function unzip(buf){
 if(buf[0]===0x89&&buf[1]===0x50)return buf;   // 이미 PNG
 const head=()=>`길이 ${buf.length}, 앞 16바이트 ${buf.slice(0,16).toString('hex')}`;
 // 크기는 중앙 디렉터리에서 읽는다(로컬 헤더는 데이터 서술자 플래그면 크기가 0이다)
 let e=-1;for(let i=buf.length-22;i>=Math.max(0,buf.length-65557);i--)if(buf.readUInt32LE(i)===0x06054b50){e=i;break;}
 if(e<0)throw Error('ZIP이 아닙니다 ('+head()+')');
 let c=buf.readUInt32LE(e+16);const count=buf.readUInt16LE(e+10);
 for(let k=0;k<count&&buf.readUInt32LE(c)===0x02014b50;k++){
  const method=buf.readUInt16LE(c+10),csize=buf.readUInt32LE(c+20),nlen=buf.readUInt16LE(c+28),xlen=buf.readUInt16LE(c+30),clen=buf.readUInt16LE(c+32),local=buf.readUInt32LE(c+42);
  const name=buf.slice(c+46,c+46+nlen).toString();
  if(/\.(png|webp)$/i.test(name)){const start=local+30+buf.readUInt16LE(local+26)+buf.readUInt16LE(local+28),data=buf.slice(start,start+csize);
   return method===0?data:zlib.inflateRawSync(data);}
  c+=46+nlen+xlen+clen;}
 throw Error('ZIP 안에 이미지가 없습니다 ('+head()+')');
}
async function call(body){
 for(let attempt=0;attempt<8;attempt++){
  const r=await fetch('https://image.novelai.net/ai/generate-image',{method:'POST',headers:{'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json','Accept':'application/zip, image/png, */*'},body:JSON.stringify(body)});
  if(r.ok)return Buffer.from(await r.arrayBuffer());
  const text=(await r.text()).slice(0,500);
  if(r.status===429){const w=+(r.headers.get('retry-after')||0)*1000||15000*(attempt+1);console.log(`  429 대기 ${w/1000}s: ${text}`);await sleep(w);continue;}
  // params_version은 클라이언트마다 4/3으로 갈린다 — 서버가 거부하면 3으로 한 번 더
  if(body.parameters.params_version===4&&(r.status===400||r.status===500)){console.log(`  ${r.status} (params_version 4): ${text} → 3으로 재시도`);body.parameters.params_version=3;continue;}
  throw Error(`HTTP ${r.status}: ${text}`);
 }
 throw Error('재시도 한도 초과');
}
const report=[];let made=0,fail=0;
for(const f of jobFiles){
 const spec=JSON.parse(fs.readFileSync(path.join(ROOT,f),'utf8'));
 for(const job of spec.jobs||[]){
  const seeds=job.seeds||[job.seed??Math.floor(Math.random()*4294967295)];
  for(const seed of seeds){
   const out=job.seeds?job.out.replace(/(\.png)$/i,`_s${seed}$1`):job.out,abs=path.join(ROOT,out);
   if(!FORCE&&fs.existsSync(abs)){console.log('건너뜀(있음):',out);continue;}
   const body=build(job,seed);
   if(DRY){console.log(JSON.stringify({out,...body},null,1));continue;}
   try{
    console.log('생성:',out,`seed=${seed}`,`${body.parameters.width}x${body.parameters.height}`);
    const raw=await call(body);let img;
    try{img=unzip(raw);}catch(e){const dump=path.join(ROOT,'tools/nai/log','raw-'+path.basename(out,'.png')+'.bin');fs.mkdirSync(path.dirname(dump),{recursive:true});fs.writeFileSync(dump,raw);throw Error(e.message+' → 원본 응답 저장: '+path.relative(ROOT,dump));}
    fs.mkdirSync(path.dirname(abs),{recursive:true});fs.writeFileSync(abs,img);
    // 다시 만들 수 있게 프롬프트·시드를 옆에 남긴다
    fs.writeFileSync(abs.replace(/\.png$/i,'.json'),JSON.stringify({seed,model:body.model,params_version:body.parameters.params_version,init:job.init||null,prompt:body.input,chars:body.parameters.v4_prompt.caption.char_captions,uc:body.parameters.negative_prompt,size:[body.parameters.width,body.parameters.height]},null,1));
    made++;report.push(`✅ ${out} (seed ${seed}, params_version ${body.parameters.params_version})`);
   }catch(e){fail++;report.push(`❌ ${out}: ${e.message}`);console.error('  실패:',e.message);}
   await sleep(6000);   // 동시 생성 잠김(429) 방지 — 2.5초로는 5장 중 2장이 막혔다
  }
 }
}
const summary=`NAI 생성 ${made}장 성공, ${fail}장 실패\n`+report.join('\n');console.log('\n'+summary);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary.replace(/\n/g,'\n\n')+'\n');
fs.mkdirSync(path.join(ROOT,'tools/nai/log'),{recursive:true});fs.writeFileSync(path.join(ROOT,'tools/nai/log/last-run.txt'),new Date().toISOString()+'\n'+summary+'\n');
if(fail&&!made)process.exit(1);
