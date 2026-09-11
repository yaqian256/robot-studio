import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../app/robots.ts',import.meta.url),'utf8');
const ids=[...source.matchAll(/\{id:'((?:unitree|fourier|agibot)-[^']+)',name:/g)].map(match=>match[1]);
const expected=['unitree-g1','unitree-g1-23dof','unitree-h1','unitree-h1-2','unitree-h1-2-handless','unitree-h1-2-ftp-hand','fourier-gr1','fourier-gr2','fourier-gr3','fourier-n1','agibot-x1','unitree-a1','unitree-aliengo','unitree-b1','unitree-b2','unitree-go1','unitree-go2'];
if(ids.length!==17)throw new Error(`Expected 17 robots, found ${ids.length}.`);
if(new Set(ids).size!==ids.length)throw new Error('Robot IDs must be unique.');
for(const id of expected)if(!ids.includes(id))throw new Error(`Missing catalog robot: ${id}`);
for(const company of ['unitree','fourier','agibot'])if(!source.includes(`company:'${company}'`))throw new Error(`Missing company: ${company}`);
for(const kind of ['humanoid','quadruped'])if(!source.includes(`kind:'${kind}'`))throw new Error(`Missing kind: ${kind}`);
const modelCalls=[...source.matchAll(/model:(?:unitreeModel|relativeModel)\(/g)];
if(modelCalls.length!==17)throw new Error(`Expected 17 URDF model contracts, found ${modelCalls.length}.`);
if(!source.includes('https://raw.githubusercontent.com/'))throw new Error('URDF fallbacks must use upstream HTTPS sources.');
console.log('Validated 17 upstream URDF models across 3 companies.');
