import {readFileSync,statSync} from 'node:fs';

const root=new URL('../public/models/robots/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'));
const expected=['unitree-g1','unitree-h1','fourier-gr1','fourier-n1','unitree-a1','unitree-b1','unitree-b2','unitree-go1','unitree-go2'];
for(const id of expected){
 const entry=manifest.find(item=>item.id===id);
 if(!entry)throw new Error(`Missing model manifest entry: ${id}`);
 if(!entry.license||!entry.source||!entry.revision)throw new Error(`Incomplete provenance for ${id}`);
 if(entry.visuals<1)throw new Error(`No visual geometry for ${id}`);
 const path=new URL(entry.url.replace('/models/robots/',''),root);
 if(statSync(path).size<100_000)throw new Error(`Model asset is unexpectedly small: ${id}`);
}
console.log(`Validated ${expected.length} complete URDF-derived model assets.`);
