// builds GB/brand/cards-index.js: per-faith episode order + each card's poster, end-card line and place
// node tools/build-cards.cjs [GB folder]   (GB defaults to this script's parent folder, prototypes/greybox)
const fs=require('fs'),path=require('path');const GB=process.argv[2]||path.dirname(__dirname);
const list=JSON.parse(fs.readFileSync(path.join(GB,'episodes/list.json'),'utf8'));
const places=JSON.parse(fs.readFileSync(path.join(GB,'lessons/places.json'),'utf8'));
const order={},c={};let miss=[];
for(const id of list){const L=JSON.parse(fs.readFileSync(path.join(GB,'lessons',id+'.json'),'utf8'));
 (order[L.home]=order[L.home]||[]).push(id);
 const s=(L.steps||[]).find(x=>x&&x.v);let cfg={};try{cfg=JSON.parse(fs.readFileSync(path.join(GB,'episodes/configs',id+'.json'),'utf8'))}catch(e){miss.push(id)}
 const e=cfg.end||{};const P=places[id];
 c[id]={h:L.home,t:L.title,p:s&&L.clips?L.clips+s.v+'.webp':'',eh:e.h||[],el:e.line||'',pl:P?P.name.split(',')[0].replace(/\s*\(.*?\)/g,''):''};}
const out='// generated from episodes/list.json, lessons/*.json, episodes/configs/*.json and lessons/places.json (2026-11-07)\n// cards: every episode is a collectible story card. order = each faith\'s card numbers (No. 001…).\nwindow.IH_CARDS = '+JSON.stringify({order,c})+';\n';
fs.writeFileSync(path.join(GB,'brand/cards-index.js'),out);console.log('cards',Object.keys(c).length,'no config',miss,'bytes',out.length);
console.log('no poster',Object.keys(c).filter(k=>!c[k].p),'no end',Object.keys(c).filter(k=>!c[k].eh.length).length,'no place',Object.keys(c).filter(k=>!c[k].pl).length);
