import {buildPyramid, reconstruct, meanError} from './pyramid.js';
const $ = id => document.getElementById(id);
const source = $('source'), ctx = source.getContext('2d', {willReadFrequently: true});
let currentPyramid, inputImage, enabled = [], uploadRevision = 0;
function polygon(points, color) {
  ctx.fillStyle = color; ctx.beginPath();
  points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill();
}
function sample(name) {
  uploadRevision++;
  source.width = 320; source.height = 240;
  ctx.clearRect(0,0,320,240);
  if (name === 'landscape') {
    const sky = ctx.createLinearGradient(0,0,0,240); sky.addColorStop(0,'#9ac2c0'); sky.addColorStop(.55,'#e7dfbb'); sky.addColorStop(1,'#4c8d7c');ctx.fillStyle=sky;ctx.fillRect(0,0,320,240);
    ctx.fillStyle='#f8edc8';ctx.beginPath();ctx.arc(247,48,19,0,Math.PI*2);ctx.fill();
    polygon([[0,117],[48,58],[75,95],[119,30],[161,90],[186,58],[248,121],[320,79],[320,190],[0,190]],'#7c9b94');
    polygon([[65,110],[119,30],[156,83],[137,77],[125,64],[114,69],[108,55],[90,91]],'#e1e5cf');
    polygon([[0,143],[57,95],[100,151],[152,103],[213,152],[275,88],[320,124],[320,185],[0,185]],'#567c73');
    polygon([[239,124],[275,88],[306,114],[286,107],[278,103],[270,111],[263,107]],'#b7c4a9');
    polygon([[0,157],[48,165],[105,155],[168,167],[233,157],[320,164],[320,240],[0,240]],'#75a799');
    for(let i=0;i<35;i++){const y=170+i*2;ctx.strokeStyle=i%3?'#b7c9a133':'#e9ddb266';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(100+(i*29)%65,y);ctx.lineTo(160+(i*37)%85,y);ctx.stroke();}
    polygon([[0,143],[27,159],[61,180],[93,201],[55,217],[0,220]],'#42695a');
    polygon([[320,148],[287,165],[262,193],[239,215],[320,239]],'#4b6f56');
    polygon([[0,222],[54,210],[98,217],[155,240],[0,240]],'#c3b68a');
    let seed=91;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    for(let i=0;i<64;i++){const side=i%2, x=side?281+random()*41:random()*58,y=158+random()*73,height=8+random()*35;ctx.fillStyle='#3c5848';ctx.fillRect(x-0.6,y-height,1.2,height+3);polygon([[x,y-height-8],[x-height*.27,y-2],[x+height*.27,y-2]],side?'#365b4b':'#31584e');}
    for(let i=0;i<170;i++){const x=random()*320,y=215+random()*25;if(x>150&&x<265)continue;ctx.fillStyle=['#e3d2a0','#71855a','#a49769'][i%3];ctx.fillRect(x,y,1+random()*2,1+random()*3);}
  } else if (name === 'geometry') {
    ctx.fillStyle='#eadfc5';ctx.fillRect(0,0,320,240);
    ctx.fillStyle='#d9855f';ctx.beginPath();ctx.arc(112,106,72,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#3b695b';ctx.fillRect(163,84,111,118);
    polygon([[43,206],[130,64],[204,206]],'#e9bd66');
    ctx.strokeStyle='#f7f3e7';ctx.lineWidth=3;for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(252,45,15+i*7,0,Math.PI*2);ctx.stroke();}
  } else {
    const pixels=ctx.createImageData(320,240);
    for(let y=0;y<240;y++)for(let x=0;x<320;x++){const i=(y*320+x)*4;const v=128+48*Math.sin(x*(.02+y/650))+35*Math.cos(y*.45)+20*Math.sin(x*.9);pixels.data[i]=v*.82;pixels.data[i+1]=v;pixels.data[i+2]=v*.78;pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);
  }
  $('image-name').textContent = {landscape:'Alpine afternoon',geometry:'Shapes & shadows',texture:'Waves & frequencies'}[name];
  document.querySelectorAll('.sample').forEach(b=>{b.classList.toggle('active',b.dataset.sample===name);b.setAttribute('aria-pressed',String(b.dataset.sample===name));});
  $('upload-status').textContent='Images stay on your device · PNG, JPG, WebP';
  readInput(); update();
}
function readInput() {
  const rgba=ctx.getImageData(0,0,source.width,source.height).data;
  const data = new Float64Array(source.width*source.height*3);
  for(let i=0;i<data.length/3;i++)for(let c=0;c<3;c++)data[i*3+c]=rgba[i*4+c];
  inputImage={w:source.width,h:source.height,data};
}
function paint(canvas,img,residual=false) {
  canvas.width=img.w;canvas.height=img.h;
  const c=canvas.getContext('2d'), rgba=c.createImageData(img.w,img.h);
  for(let i=0;i<img.w*img.h;i++){for(let k=0;k<3;k++)rgba.data[i*4+k]=residual?128+3*img.data[i*3+k]:img.data[i*3+k];rgba.data[i*4+3]=255;}c.putImageData(rgba,0,0);
}
function tile(img, label, residual=false) {
  const div=document.createElement('div');div.className='tile';
  const canvas=document.createElement('canvas');paint(canvas,img,residual);canvas.style.width=Math.min(220,img.w)+'px';canvas.style.height='auto';canvas.setAttribute('aria-label',label);
  const tag=document.createElement('span');tag.className='tile-tag';tag.textContent=label;
  div.append(canvas,tag);return div;
}
function update() {
  const levels=Number($('levels').value),sigma=Number($('sigma').value);
  $('levels-value').textContent=levels;$('sigma-value').textContent=sigma.toFixed(1);
  currentPyramid=buildPyramid(inputImage,levels,sigma);
  const previous=enabled;enabled=Array.from({length:levels-1},(_,i)=>previous[i]??true);
  $('pyramid').replaceChildren();
  currentPyramid.gaussian.forEach((img,i)=>{
    const row=document.createElement('div');row.className='pyramid-row';
    const label=document.createElement('div');label.className='level-label';label.innerHTML=`<span>Level ${i}</span><small>${img.w} × ${img.h}</small>`;
    const operation=document.createElement('div');operation.className='operation';operation.textContent=i<levels-1?'→':'→';operation.setAttribute('aria-hidden','true');
    row.append(label,tile(img,`G${i}`),operation);
    if(i<levels-1)row.append(tile(currentPyramid.laplacian[i],`L${i} · detail`,true));
    else {const note=document.createElement('div');note.className='coarse-note';note.innerHTML='<strong>The foundation</strong>Keep this smallest image.<br>It holds the coarse structure.';row.append(note);}
    $('pyramid').append(row);
  });
  $('layer-switches').replaceChildren();enabled.forEach((value,i)=>{
    const label=document.createElement('label'),checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=value;checkbox.addEventListener('change',()=>{enabled[i]=checkbox.checked;renderReconstruction();});label.append(checkbox,`L${i}${i===0?' · finest':''}`);$('layer-switches').append(label);
  });
  renderReconstruction();
}
function renderReconstruction(){const result=reconstruct(currentPyramid,enabled);paint($('original'),inputImage);paint($('reconstructed'),result);$('error').textContent=meanError(inputImage,result).toFixed(4);$('reconstruction-caption').textContent=enabled.every(Boolean)?'Reconstructed · all details restored':'Reconstructed · selected details only';}
document.querySelectorAll('.sample').forEach(b=>b.addEventListener('click',()=>sample(b.dataset.sample)));
let frame;for(const id of ['levels','sigma'])$(id).addEventListener('input',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);});
function setTab(reconstruction){for(const name of ['build','reconstruct']){const active=(name==='reconstruct')===reconstruction;$(`tab-${name}`).classList.toggle('active',active);$(`tab-${name}`).setAttribute('aria-selected',String(active));$(`tab-${name}`).tabIndex=active?0:-1;$(`${name}-panel`).hidden=!active;}}
$('tab-build').addEventListener('click',()=>setTab(false));$('tab-reconstruct').addEventListener('click',()=>setTab(true));
document.querySelector('.tabs').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const target=e.key==='Home'?'build':e.key==='End'?'reconstruct':$('tab-build').getAttribute('aria-selected')==='true'?'reconstruct':'build';setTab(target==='reconstruct');$(`tab-${target}`).focus();}});
$('reset').addEventListener('click',()=>{$('levels').value=4;$('sigma').value=1.2;enabled=[];$('upload').value='';setTab(false);sample('landscape');});
$('upload').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  const revision=++uploadRevision;
  if(!file.type.startsWith('image/')){$('upload-status').textContent='Please choose an image file.';return;}
  if(file.size>20*1024*1024){$('upload-status').textContent='Please choose an image smaller than 20 MB.';return;}
  const url=URL.createObjectURL(file),img=new Image();
  try{img.src=url;await img.decode();if(revision!==uploadRevision)return;
    const scale=Math.min(320/img.naturalWidth,240/img.naturalHeight,1);source.width=Math.max(1,Math.round(img.naturalWidth*scale));source.height=Math.max(1,Math.round(img.naturalHeight*scale));ctx.fillStyle='#fff';ctx.fillRect(0,0,source.width,source.height);ctx.drawImage(img,0,0,source.width,source.height);
    $('image-name').textContent=file.name;document.querySelectorAll('.sample').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});$('upload-status').textContent=`Processed locally at ${source.width} × ${source.height} pixels`;readInput();update();
  }catch{if(revision===uploadRevision)$('upload-status').textContent='This image could not be opened. Try PNG, JPG, or WebP.';}finally{URL.revokeObjectURL(url);}
});
const descriptions=[
  'Blurring reduces aliasing: without it, fine patterns can become misleading shapes when sampled at a smaller size. Adjust σ above to see the effect.',
  'Each smaller image covers the same scene with one quarter as many pixels. Repeat blur → downsample until you reach the smallest level. The level count includes the original image.',
  'The residual is a signed difference, not an edge filter. To rebuild, use the same expansion and add the residual: Gₖ = expand(Gₖ₊₁) + Lₖ. This demo uses bilinear expansion.'
];
document.querySelectorAll('.step').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.step').forEach(s=>{s.classList.toggle('active',s===b);s.setAttribute('aria-pressed',String(s===b));});$('step-description').textContent=descriptions[Number(b.dataset.step)];}));
sample('landscape');
