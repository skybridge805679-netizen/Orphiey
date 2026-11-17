// NAI 생성본(assets/nai/…)을 게임이 쓰는 파일 이름으로 설치한다. 새 그림이 들어올 때마다 다시 돌리면 된다.
// 실행: node tools/nai/install.mjs [--dry]
//  chr/*   → assets/<같은 이름>          (스탠딩)
//  face/face_{neutral,smile,…}.png → assets/ui/face_*.png 와 assets/orpheia_face_*.png (오르페이아 얼굴 아이콘)
//  face/face_<역할>.png → assets/face_<역할>.png (역할극 아이콘)
//  bg/*, cg/* → assets/<같은 이름>
import fs from 'node:fs';import path from 'node:path';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..','..'),A=p=>path.join(ROOT,'assets',p),DRY=process.argv.includes('--dry');
const ORP_FACES=['neutral','smile','worry','serious','relief','resolve'];
const plan=[];
for(const dir of ['chr','bg','cg'])for(const f of fs.existsSync(A('nai/'+dir))?fs.readdirSync(A('nai/'+dir)):[])if(f.endsWith('.png'))plan.push([`nai/${dir}/${f}`,f]);
for(const f of fs.existsSync(A('nai/face'))?fs.readdirSync(A('nai/face')):[]){
 if(!f.endsWith('.png'))continue;const m=f.match(/^face_(.+)\.png$/);
 if(m&&ORP_FACES.includes(m[1])){plan.push([`nai/face/${f}`,`ui/${f}`]);plan.push([`nai/face/${f}`,`orpheia_face_${m[1]}.png`]);}
 else plan.push([`nai/face/${f}`,f]);
}
let n=0;
for(const [from,to] of plan){
 const a=fs.readFileSync(A(from)),dst=A(to);
 if(fs.existsSync(dst)&&fs.readFileSync(dst).equals(a))continue;
 if(!DRY)fs.writeFileSync(dst,a);n++;console.log((DRY?'(dry) ':'')+from+' → assets/'+to);
}
console.log(`설치 ${n}개 (전체 대상 ${plan.length})`);
