import type * as THREE from 'three';
import type {ComponentId,RobotKind} from './robots';

export interface PieceSummary {
 id:string;
 label:string;
 link:string;
 component:ComponentId;
 index:number;
}

export interface ModelPiece extends PieceSummary {
 node:THREE.Mesh;
 bounds:THREE.Box3;
 center:THREE.Vector3;
 homePosition:THREE.Vector3;
 radialOffset:THREE.Vector3;
 inventoryOffset:THREE.Vector3;
 materials:THREE.Material[];
}

const clean=(value:string)=>value.replace(/[^a-z0-9]+/gi,' ').trim().toLowerCase();

export function componentForLink(link:string,kind:RobotKind):ComponentId {
 const name=clean(link);
 if(/\b(camera|lidar|radar|imu|sensor|logo)\b/.test(name))return'sensors';
 if(/\b(head|neck)\b/.test(name))return'head';
 if(/\b(hand|finger|thumb|gripper)\b/.test(name))return'hand';
 if(/\b(wrist|lower arm|forearm|elbow)\b/.test(name))return'forearm';
 if(/\b(upper arm|shoulder)\b/.test(name))return'upper-arm';
 if(/\b(foot|toe)\b/.test(name))return'foot';
 if(/\b(ankle|calf|shank|lower leg)\b/.test(name))return kind==='quadruped'?'calf':'shank';
 if(/\b(knee|thigh|upper leg)\b/.test(name))return'thigh';
 if(/\b(hip)\b/.test(name))return kind==='quadruped'?'hip':'pelvis';
 if(/\b(pelvis|waist|lumbar|lumber)\b/.test(name))return'pelvis';
 if(kind==='quadruped')return'trunk';
 return'torso';
}

export function labelForPiece(link:string,index:number){
 const words=link.replace(/(stl|dae|obj)(?=_\d+$|$)/i,'').replace(/(_link|_joint|_visual)$/i,'').replace(/[_-]+/g,' ').trim();
 const label=words.replace(/\b\w/g,letter=>letter.toUpperCase());
 return label||`Visual piece ${index+1}`;
}
