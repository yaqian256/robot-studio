import * as THREE from 'three';

export interface LayoutPiece {id:string;component:string;bounds:THREE.Box3}
export interface LayoutSlot {translation:THREE.Vector3;center:THREE.Vector3;width:number;height:number}
export const overviewDirection=new THREE.Vector3(3,1.6,4).normalize();
const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),overviewDirection).normalize();
const up=new THREE.Vector3().crossVectors(overviewDirection,right).normalize();

export function projectBounds(bounds:THREE.Box3){
 const {min,max}=bounds;let left=Infinity,bottom=Infinity,rightEdge=-Infinity,top=-Infinity;
 for(const x of [min.x,max.x])for(const y of [min.y,max.y])for(const z of [min.z,max.z]){
  const corner=new THREE.Vector3(x,y,z),u=corner.dot(right),v=corner.dot(up);
  left=Math.min(left,u);rightEdge=Math.max(rightEdge,u);bottom=Math.min(bottom,v);top=Math.max(top,v);
 }
 return {width:rightEdge-left,height:top-bottom};
}

export function createExplosionLayout(pieces:LayoutPiece[],aspect=1){
 const cards=pieces.map(piece=>{
  const projected=projectBounds(piece.bounds);
  const size=piece.bounds.getSize(new THREE.Vector3()),padding=Math.max(.025,Math.min(.12,size.length()*.08));
  return {...piece,width:Math.max(.035,projected.width)+padding,height:Math.max(.035,projected.height)+padding,center:piece.bounds.getCenter(new THREE.Vector3())};
 }).sort((a,b)=>a.component.localeCompare(b.component)||b.height-a.height||a.id.localeCompare(b.id));
 const area=cards.reduce((sum,card)=>sum+card.width*card.height,0);
 const maxCard=Math.max(.2,...cards.map(card=>card.width));
 const targetWidth=Math.max(maxCard,Math.sqrt(area*Math.max(.55,Math.min(1.8,aspect)))*1.15);
 let x=0,y=0,rowHeight=0;
 const slots=cards.map(card=>{
  if(x&&x+card.width>targetWidth){x=0;y+=rowHeight;rowHeight=0;}
  const slot={...card,x:x+card.width/2,y:y+card.height/2};x+=card.width;rowHeight=Math.max(rowHeight,card.height);return slot;
 });
 const width=Math.max(targetWidth,x),height=y+rowHeight,layoutCenter=new THREE.Vector3(0,height*.5+.12,0);
 const result=new Map<string,LayoutSlot>();
 for(const slot of slots){
  const center=layoutCenter.clone().addScaledVector(right,slot.x-width/2).addScaledVector(up,height/2-slot.y);
  result.set(slot.id,{translation:center.clone().sub(slot.center),center,width:slot.width,height:slot.height});
 }
 return {pieces:result,width,height,center:layoutCenter};
}
