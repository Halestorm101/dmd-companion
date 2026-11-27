'use strict';
const CORE=['Adam','Ahmed','Borden','Elizabeth','Fatima','Ian','Morgan','Rasputin','Sister Beth','The Kid'];
const S2=['Adilah','Alex','Ariele','Hailia','Luke','Margarethe','Mario','Mary','Sam','Tony'];
const EXTRA_ELDERS={'yog-sothoth':'Yog-Sothoth','black-goat':'The Black Goat of the Woods','ithaqua':'Ithaqua'};
function elders(extras=[]){return ['Cthulhu','Hastur',...extras.map(id=>EXTRA_ELDERS[id])];}
const KEY='dmd-companion-v1';
const $=id=>document.getElementById(id);
function episodes(s2){return [1,...(s2?[2]:[])].flatMap(s=>Array.from({length:6},(_,i)=>`Season ${s} · Episode ${i+1}`));}
const EPISODE_TITLES={
  1:['Blasphemous Alchemy','Tomes of Madness','Danse Macabre','Eldritch Idols','Accursed Tide','Unspeakable Hour'],
  2:['Strange Bedfellows','Nameless Woods','Sanctificetur Nomen','Shootout at the H.P. Corral','Monsters in Sin City','Endgame']
};
function episodeTitle(id){
  const match=/^Season ([12]) · Episode ([1-6])$/.exec(id);
  return match?EPISODE_TITLES[match[1]][Number(match[2])-1]:id;
}
const PORTRAIT_EXT={};
function applyCardArt(row,key,value){
  if(!value)return;
  row.classList.add('illustrated');
  if(key==='team'){
    row.classList.add('portrait');
    const name=value.toLowerCase().replaceAll(' ','-');
    row.style.setProperty('--card-art',`url("assets/investigators/${name}.${PORTRAIT_EXT[value]||'jpg'}")`);
    row.style.setProperty('--art-size','auto 190%');
    row.style.setProperty('--art-position','right 20%');
  }else{
    const isEpisode=key==='episode';
    const match=isEpisode?/^Season ([12]) · Episode ([1-6])$/.exec(value):null;
    const elderOrder=['Cthulhu','Hastur','The Black Goat of the Woods','Yog-Sothoth','Ithaqua'];
    const n=isEpisode?(Number(match[1])-1)*6+Number(match[2])-1:elderOrder.indexOf(value);
    const cols=isEpisode?4:3,rows=isEpisode?3:2;
    row.style.setProperty('--card-art',`url("assets/${isEpisode?'episodes':'elders'}-atlas.jpg")`);
    row.style.setProperty('--art-size',`${cols*100}% ${rows*100}%`);
    row.style.setProperty('--art-position',`${(n%cols)/(cols-1)*100}% ${Math.floor(n/cols)/(rows-1)*100}%`);
  }
}
function investigators(s2){return [...CORE,...(s2?S2:[])];}
function pick(pool,previous){const options=pool.filter(x=>x!==previous);return options[Math.floor(Math.random()*options.length)]??previous;}
function fresh(){return {version:2,elderBoxes:[],season2:false,count:2,episode:null,elder:null,team:[]};}
let state=fresh();
let hasEncounter=false;
function say(message){$('status').textContent=message;}
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:2,season2:state.season2,count:state.count,elderBoxes:state.elderBoxes}));}catch{say('Your collection choices could not be remembered in this browser.');}}
function rollAll(){
  state.episode=pick(episodes(state.season2),state.episode);
  state.elder=pick(elders(state.elderBoxes),state.elder);
  const next=[];
  for(let i=0;i<state.count;i++)next.push(pick(investigators(state.season2).filter(x=>!next.includes(x)),state.team[i]));
  state.team=next;
}
function render(){ $('encounter').hidden=!hasEncounter;Object.keys(EXTRA_ELDERS).forEach(id=>$(id).checked=state.elderBoxes.includes(id));$('season2').checked=state.season2;$('count').value=state.count;$('pool').textContent=`${episodes(state.season2).length} episodes · ${elders(state.elderBoxes).length} Elder Ones · ${investigators(state.season2).length} investigators`;$('results').replaceChildren();
function card(label,value,key,index){const row=document.createElement('article');row.className='card';applyCardArt(row,key,value);const text=document.createElement('div');const tag=document.createElement('span');tag.className='tag';tag.textContent=label;const title=document.createElement('h3');title.textContent=key==='episode'?episodeTitle(value):value;text.append(tag,title);if(key==='episode'){const number=document.createElement('p');number.className='hint';number.textContent=value;text.append(number);}const actions=document.createElement('div');actions.className='actions';const reroll=document.createElement('button');reroll.textContent='Reroll';reroll.setAttribute('aria-label',`Reroll ${label}`);reroll.onclick=()=>{if(key==='episode')state.episode=pick(episodes(state.season2),value);else if(key==='elder')state.elder=pick(elders(state.elderBoxes),value);else state.team[index]=pick(investigators(state.season2).filter(x=>!state.team.includes(x)),value);say(`${label} rerolled.`);save();render();};actions.append(reroll);row.append(text,actions);$('results').append(row);}
card('Episode',state.episode,'episode');card('Elder One',state.elder,'elder');state.team.forEach((name,i)=>card(`Investigator ${i+1} · ${CORE.includes(name)?'Core':'Season 2'}`,name,'team',i));}
try{const raw=localStorage.getItem(KEY);if(raw){
  const saved=JSON.parse(raw);
  {
    if(!saved||![1,2].includes(saved.version)||typeof saved.season2!=='boolean'||![2,3,4,5].includes(saved.count))throw Error('Invalid preferences');
    const boxes=saved.version===1?[]:saved.elderBoxes;
    if(!Array.isArray(boxes)||new Set(boxes).size!==boxes.length||boxes.some(id=>!Object.hasOwn(EXTRA_ELDERS,id)))throw Error('Invalid collection');
    state={...fresh(),season2:saved.season2,count:saved.count,elderBoxes:[...boxes]};
  }
}}catch{say('Saved collection choices could not be loaded. Default options are shown.');}
// Keep collection preferences across refreshes, but start with an empty encounter.
state.episode=null;
state.elder=null;
state.team=[];
render();
function showEncounter(){
  hasEncounter=true;
  $('encounter').hidden=false;
  $('setup-options').hidden=true;
  $('change-setup').hidden=false;
  $('change-setup').setAttribute('aria-expanded','false');
  $('setup').focus({preventScroll:true});
  $('encounter').scrollIntoView({block:'start',behavior:'instant'});
}
$('generate').onclick=()=>{rollAll();say('Setup generated.');save();hasEncounter=true;render();showEncounter();};
$('change-setup').onclick=()=>{
  $('setup-options').hidden=false;
  $('change-setup').hidden=true;
  $('change-setup').setAttribute('aria-expanded','true');
  $('season2').focus({preventScroll:true});
  $('setup-options').scrollIntoView({block:'start',behavior:'instant'});
};
$('season2').onchange=e=>{state.season2=e.target.checked;if(!episodes(state.season2).includes(state.episode)){state.episode=null;}state.team.forEach((x,i)=>{if(!investigators(state.season2).includes(x)){state.team[i]=null;}});if(hasEncounter)rollAll();say('Collection updated.');save();render();};
$('count').onchange=e=>{state.count=Number(e.target.value);state.team=state.team.slice(0,state.count);if(hasEncounter)rollAll();say('Team size updated.');save();render();};
Object.keys(EXTRA_ELDERS).forEach(id=>$(id).onchange=e=>{state.elderBoxes=e.target.checked?[...state.elderBoxes,id]:state.elderBoxes.filter(x=>x!==id);if(hasEncounter&&!elders(state.elderBoxes).includes(state.elder)){state.elder=pick(elders(state.elderBoxes),state.elder);say('Removed Elder One replaced. Episode and team kept.');}else say('Elder One collection updated. Current setup kept.');save();render();});
