import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPyramid,reconstruct,meanError,blur} from '../pyramid.js';
const makeImage=(w,h,fn)=>({w,h,data:Float64Array.from({length:w*h*3},(_,i)=>fn(i))});
test('all residuals reconstruct RGB images exactly, including odd and tiny dimensions',()=>{
  for(const [w,h] of [[32,24],[31,23],[1,1],[1,15]])for(const sigma of [.6,1.2,2.4]){
    const image=makeImage(w,h,i=>(i*71+i*i*3)%256),p=buildPyramid(image,5,sigma);
    assert.ok(meanError(image,reconstruct(p))<1e-10);
    for(let i=1;i<p.gaussian.length;i++){assert.equal(p.gaussian[i].w,Math.ceil(p.gaussian[i-1].w/2));assert.equal(p.gaussian[i].h,Math.ceil(p.gaussian[i-1].h/2));}
  }
});
test('constant images have zero detail and Gaussian filtering preserves brightness',()=>{
  const image=makeImage(19,17,()=>123),p=buildPyramid(image,4,1.2);
  for(const layer of p.laplacian)assert.ok(layer.data.every(v=>Math.abs(v)<1e-10));
  assert.ok(meanError(image,blur(image,2.4))<1e-10);
});
test('removing detail layers changes reconstruction; detail retains signed values',()=>{
  const image=makeImage(32,24,i=>(i*53)%256),p=buildPyramid(image,4,1.2);
  assert.ok(meanError(image,reconstruct(p,[false,false,false]))>10);
  assert.ok(p.laplacian[0].data.some(v=>v<0));assert.ok(p.laplacian[0].data.some(v=>v>0));
});
