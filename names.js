'use strict';
// Fills the textbook's blank place-holders (○○선, △△역, □□터널 …) with names from the story world.
// training-data.json stays untouched; this runs once on DATA before app.js indexes it.
// Report templates inside answer options (○위 축, ○○량째, ○○기점 ○○km) are left as written: they are
// the form the answer asks for, not a missing name.
(()=>{
const LINE='한빛선',HSR='한빛고속선';
// One pool, assigned in order to each scenario that needs places, skipping names that scenario already uses.
const POOL=['솔빛','가온','한내','새말','마루','아라','너울','다래','은솔','한결','늘봄','보라','이슬','단비','초롱','산들','윤슬','고요','봄내','청솔','달내','모래내','솔숲','해든','새벽','푸실','온새','도담','라온','미담','여울','소솜','다올','하제','예솔','길섶','나린','차오름','물오름','별다솜'];
const HAND={ // values the dialogue reads aloud; picked once so retries sound the same
 'R-2-26':[[/발생 ○시○분/g,'발생 14시 32분'],[/원인 책임자 ○○/g,'원인 책임자 신호팀 한기수'],[/민원 ○건/g,'민원 3건'],[/복구 담당자 ○○/g,'복구 담당자 신호팀 한기수'],[/재고 ○개/g,'재고 2개'],[/승차인원 ○명/g,'승차인원 412명']],
 'R-2-16':[[/북위 ○○, 동경 ○○/g,'북위 36.48, 동경 127.32'],[/○○호/g,'17호'],[/○○교/g,'솔내천교']],
 'R-2-14':[[/역무원 ○○○으로/g,'역무원 김선우로'],[/○○차량사업소/g,'한빛차량사업소']],
 'R-2-30':[[/○○ 단로기/g,'3번 단로기']],
 'R-3-07':[[/○○건널목/g,'솔고개건널목']],
 'R-2-28':[[/○○신호장/g,'새말신호장']],
};
const FIELDS_SKIP_NUMBERS=new Set(['t','why']); // option text and reasons keep template numbers
let poolAt=0;
const SHARE={'R-1-02B':'R-1-02A'}; // second half of the same accident keeps the first half's places
const assigned={};
function names(sc){
 const text=JSON.stringify(sc);
 if(SHARE[sc.id]&&assigned[SHARE[sc.id]]){const map={...assigned[SHARE[sc.id]]};for(const k of ['◇◇'])if(text.includes(k)&&!map[k]){let n;do{n=POOL[poolAt++%POOL.length];}while(text.includes(n)||Object.values(map).includes(n));map[k]=n;}return map;}
 const need=['△△','□□','◇◇'].filter(k=>text.includes(k));
 if(/(?<!○)○○(?=역|터널|~| 부근| 지진계측기|, 동경)/.test(text)||/○○~/.test(text))need.unshift('○○');
 const map={};
 for(const k of need){let n;do{n=POOL[poolAt++%POOL.length];}while(text.includes(n)||Object.values(map).includes(n));map[k]=n;}
 return map;
}
function fillString(s,sc,map,key,num){
 for(const [re,v] of HAND[sc.id]||[])s=s.replace(re,v);
 s=s.replace(/○○고속선/g,HSR).replace(/○○선/g,LINE);
 if(map['○○'])s=s.replace(/(?<!○)○○(?=역|터널|~| 부근| 지진계측기)/g,map['○○']);
 for(const k of ['△△','□□','◇◇'])if(map[k])s=s.split(k).join(map[k]);
 if(!FIELDS_SKIP_NUMBERS.has(key))s=s.replace(/○○k(?!m)/g,num.k+'k').replace(/○○번/g,num.no+'번');
 return s;
}
function walk(o,sc,map,num,key){
 if(typeof o==='string')return fillString(o,sc,map,key,num);
 if(Array.isArray(o))return o.map(v=>walk(v,sc,map,num,key));
 if(o&&typeof o==='object'){for(const k of Object.keys(o))o[k]=walk(o[k],sc,map,num,k);return o;}
 return o;
}
for(const sc of DATA){
 if(!/[○△□◇]/.test(JSON.stringify(sc)))continue;
 const h=[...sc.id].reduce((a,c)=>a*31+c.charCodeAt(0)>>>0,7);
 const num={k:20+h%60,no:10+h%80};
 sc.places=names(sc);assigned[sc.id]=sc.places;
 walk(sc,sc,sc.places,num,'');
}
})();
