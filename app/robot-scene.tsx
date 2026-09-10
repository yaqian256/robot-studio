import {forwardRef,useEffect,useImperativeHandle,useRef} from 'react';
import * as THREE from 'three';
import URDFLoader from 'urdf-loader';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createExplosionLayout,overviewDirection,projectBounds} from './explosion-layout';
import {componentForLink,labelForPiece,type ModelPiece,type PieceSummary} from './model-pieces';
import {getComponent,type ComponentId,type RobotDefinition} from './robots';
import {PointerTap} from './pointer-tap';

export type SceneHandle={zoom:(factor:number)=>void;reset:()=>void;fit:()=>void};
interface Props {
 robot:RobotDefinition;
 selected:ComponentId;
 selectedPiece:string;
 explode:number;
 isolated:boolean;
 labels:boolean;
 autoRotate:boolean;
 onSelect:(component:ComponentId,pieceId:string)=>void;
 onPiecesChange:(pieces:PieceSummary[])=>void;
 onProgress:(progress:number)=>void;
 onError:(message:string)=>void;
}

type Engine={camera:THREE.PerspectiveCamera;controls:OrbitControls;fit:(immediate?:boolean)=>void;invalidate:()=>void};
type GroupInfo={id:ComponentId;offset:THREE.Vector3;anchor:THREE.Vector3};
type EmissiveMaterial=THREE.MeshStandardMaterial|THREE.MeshPhongMaterial;
type ColoredMaterial=EmissiveMaterial|THREE.MeshBasicMaterial;

function dispose(root:THREE.Object3D){
 root.traverse(object=>{
  if(!(object instanceof THREE.Mesh))return;
  object.geometry.dispose();
  (Array.isArray(object.material)?object.material:[object.material]).forEach(material=>material.dispose());
 });
}

const RobotScene=forwardRef<SceneHandle,Props>(function RobotScene(props,ref){
 const host=useRef<HTMLDivElement>(null),latest=useRef(props),engine=useRef<Engine|null>(null);
 latest.current=props;
 useImperativeHandle(ref,()=>({
  zoom(factor){const value=engine.current;if(!value)return;value.camera.position.sub(value.controls.target).multiplyScalar(factor).add(value.controls.target);value.invalidate();},
  reset(){engine.current?.fit(true);},
  fit(){engine.current?.fit(true);},
 }),[]);

 useEffect(()=>{
  const el=host.current!;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}
  catch{props.onError('This browser could not start the 3D viewer. Enable WebGL or try a current browser.');return;}
  props.onError('');props.onProgress(0);props.onPiecesChange([]);
  let disposed=false,raf=0,ready=false,dirty=true,last=performance.now(),amount=0,previousExplosion=0,frameUntil=0,lastState='';
  renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(pointer: coarse)').matches?1.2:1.65));
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;el.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label',`Complete URDF visual assembly of ${props.robot.maker} ${props.robot.name}. Drag to orbit, scroll or pinch to zoom, and tap an individual part to inspect it.`);

  const scene=new THREE.Scene();scene.fog=new THREE.Fog('#07090c',6,40);
  const camera=new THREE.PerspectiveCamera(34,1,.005,250);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=.12;controls.maxDistance=100;controls.maxPolarAngle=Math.PI*.82;controls.addEventListener('change',()=>{dirty=true;});
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xd8e7f2,0x20242a,1.5));
  const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(-3,7,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
  const rim=new THREE.DirectionalLight(new THREE.Color(props.robot.accent),2.1);rim.position.set(4,3,-5);scene.add(rim);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(12,96),new THREE.MeshStandardMaterial({color:'#0a0d11',roughness:.95,metalness:.05}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(.78,.84,.035,96),new THREE.MeshStandardMaterial({color:'#151a20',roughness:.5,metalness:.65}));platform.position.y=.017;platform.receiveShadow=true;scene.add(platform);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.73,.742,128),new THREE.MeshBasicMaterial({color:props.robot.accent,transparent:true,opacity:.44,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.038;scene.add(ring);
  const grid=new THREE.GridHelper(20,40,0x26303a,0x13191f);grid.position.y=.003;(grid.material as THREE.Material).transparent=true;(grid.material as THREE.Material).opacity=.28;scene.add(grid);
  const modelRoot=new THREE.Group();scene.add(modelRoot);

  let pieces:ModelPiece[]=[],layout:ReturnType<typeof createExplosionLayout>|null=null,assembledBounds=new THREE.Box3(),assembledCenter=new THREE.Vector3(),framingBounds=new THREE.Box3(),framingCenter=new THREE.Vector3(),viewWidth=1,viewHeight=1;
  const groups=new Map<ComponentId,GroupInfo>(),pieceMarkers:{button:HTMLButtonElement;piece:ModelPiece}[]=[],groupLabels:{button:HTMLButtonElement;group:GroupInfo}[]=[];
  const vector=new THREE.Vector3(),cameraPosition=new THREE.Vector3(),cameraQuaternion=new THREE.Quaternion(),accent=new THREE.Color('#dfff4f');
  const isEmissive=(material:THREE.Material):material is EmissiveMaterial=>material instanceof THREE.MeshStandardMaterial||material instanceof THREE.MeshPhongMaterial;
  const isColored=(material:THREE.Material):material is ColoredMaterial=>isEmissive(material)||material instanceof THREE.MeshBasicMaterial;

  const fit=(immediate=false)=>{
   if(!ready)return;
   const inventory=THREE.MathUtils.smoothstep(amount,.44,1),target=framingCenter.clone().lerp(layout?.center??framingCenter,inventory);
   const tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),projected=projectBounds(framingBounds),compact=viewWidth<=760;
   const usableHeight=Math.max(240,viewHeight-(compact?128:112)),safeAspect=viewWidth/usableHeight;
   const assembledDistance=Math.max(projected.height/(2*tangent),projected.width/(2*tangent*safeAspect))*(compact?1.1:1.07);
   target.y-=projected.height*(viewHeight<520 ? .1 : .055)*(1-inventory);
   const panelSafeScale=viewWidth>900?1.62:1.34;
   const inventoryDistance=layout?Math.max(layout.height/(2*tangent),layout.width/(2*tangent*camera.aspect))*panelSafeScale+.2:assembledDistance;
   const distance=THREE.MathUtils.lerp(assembledDistance,inventoryDistance,inventory);
   const destination=target.clone().addScaledVector(overviewDirection,distance);
   if(immediate){controls.target.copy(target);camera.position.copy(destination);}
   else{controls.target.lerp(target,.14);camera.position.lerp(destination,.14);}
   controls.update();dirty=true;
  };
  engine.current={camera,controls,fit,invalidate:()=>{dirty=true;}};

  const updateLabels=()=>{
   const radial=THREE.MathUtils.smoothstep(amount,.03,.55),inventory=THREE.MathUtils.smoothstep(amount,.44,1);
   for(const {button,group} of groupLabels){
    const show=latest.current.labels&&inventory<.2&&(!latest.current.isolated||group.id===latest.current.selected);
    button.hidden=!show;if(!show)continue;
    vector.copy(group.anchor).addScaledVector(group.offset,radial*(1-inventory)).project(camera);
    button.style.transform=`translate3d(${(vector.x*.5+.5)*viewWidth}px,${(-vector.y*.5+.5)*viewHeight}px,0) translate(8px,-50%)`;
    button.classList.toggle('selected',group.id===latest.current.selected&&!latest.current.selectedPiece);
   }
   const occupied:{x:number;y:number}[]=[];
   for(const {button,piece} of pieceMarkers){
    const show=inventory>.16&&!latest.current.isolated&&(latest.current.labels||inventory>.7);
    button.hidden=!show;if(!show)continue;
    vector.copy(piece.center).add(piece.node.position).sub(piece.homePosition).project(camera);
    const x=(vector.x*.5+.5)*viewWidth,y=(-vector.y*.5+.5)*viewHeight;
    const overlaps=occupied.some(point=>Math.abs(point.x-x)<24&&Math.abs(point.y-y)<20);
    button.style.display=vector.z<1&&Math.abs(vector.x)<1.08&&Math.abs(vector.y)<1.08&&!overlaps?'flex':'none';
    if(button.style.display==='flex')occupied.push({x,y});
    button.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
    button.classList.toggle('selected',piece.id===latest.current.selectedPiece);button.classList.toggle('expanded',latest.current.labels);
   }
  };

  const finishModel=(model:THREE.Object3D)=>{
   if(disposed){dispose(model);return;}
   model.rotation.set(...props.robot.model.rotation);model.updateMatrixWorld(true);
   const initialBounds=new THREE.Box3().setFromObject(model);
   if(initialBounds.isEmpty()){props.onError('The model loaded without displayable visual geometry.');dispose(model);return;}
   const initialCenter=initialBounds.getCenter(new THREE.Vector3());
   model.position.set(-initialCenter.x,-initialBounds.min.y+.055,-initialCenter.z);model.updateMatrixWorld(true);modelRoot.add(model);
   const meshes:THREE.Mesh[]=[];model.traverse(object=>{if(object instanceof THREE.Mesh&&object.geometry.getAttribute('position'))meshes.push(object);});
   const links=meshes.map(mesh=>(mesh.name||mesh.parent?.name||'visual').replace(/\.?(stl|dae|obj)$/i,''));
   meshes.forEach((mesh,index)=>{
    const link=links[index],component=componentForLink(link,props.robot.kind);modelRoot.attach(mesh);
     if(!mesh.geometry.getAttribute('normal'))mesh.geometry.computeVertexNormals();
     mesh.castShadow=true;mesh.receiveShadow=true;
    const sourceMaterials=Array.isArray(mesh.material)?mesh.material:[mesh.material],materials=sourceMaterials.map(material=>material.clone());
    mesh.material=Array.isArray(mesh.material)?materials:materials[0];
    for(const material of materials){
     material.side=THREE.DoubleSide;
     const colored=isColored(material);
     const darkMaterial=colored&&material.color.r+material.color.g+material.color.b<.45;
     if(darkMaterial&&colored)material.color.set('#4b5660');
     if(darkMaterial&&isEmissive(material)){material.emissive.set('#111820');material.emissiveIntensity=.3;}
     if(colored&&isEmissive(material)&&material.emissive.r+material.emissive.g+material.emissive.b<.001){
      const ambientFill=props.robot.id==='unitree-laikago' ? .55 : .08;
      material.emissive.copy(material.color).multiplyScalar(ambientFill);material.emissiveIntensity=1;
     }
     if(colored)material.userData.baseColor=material.color.clone();
     if(isEmissive(material)){material.userData.baseEmissive=material.emissive.clone();material.userData.baseIntensity=material.emissiveIntensity;}
     if(material instanceof THREE.MeshStandardMaterial)material.envMapIntensity=1.2;
    }
    const id=`${link.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-${index+1}`,bounds=new THREE.Box3().setFromObject(mesh),center=bounds.getCenter(new THREE.Vector3());
    pieces.push({id,label:labelForPiece(link,index),link,component,index:index+1,node:mesh,bounds,center,homePosition:mesh.position.clone(),radialOffset:new THREE.Vector3(),inventoryOffset:new THREE.Vector3(),materials});
    mesh.userData.pieceId=id;mesh.userData.component=component;
   });
   model.removeFromParent();dispose(model);
   assembledBounds=new THREE.Box3().setFromObject(modelRoot);assembledCenter=assembledBounds.getCenter(new THREE.Vector3());
   const assembledSize=assembledBounds.getSize(new THREE.Vector3()),platformRadius=Math.min(.84,Math.max(.65,Math.max(assembledSize.x,assembledSize.z)*.72)),platformScale=platformRadius/.84;
   platform.scale.set(platformScale,1,platformScale);ring.scale.set(platformScale,platformScale,1);
   framingBounds=assembledBounds.clone().union(new THREE.Box3(new THREE.Vector3(-platformRadius,0,-platformRadius),new THREE.Vector3(platformRadius,.055,platformRadius)));framingCenter=framingBounds.getCenter(new THREE.Vector3());
   const modelScale=Math.max(assembledSize.length(),.4);
   for(const component of props.robot.components){
    const members=pieces.filter(piece=>piece.component===component);if(!members.length)continue;
    const bounds=new THREE.Box3();members.forEach(piece=>bounds.union(piece.bounds));const anchor=bounds.getCenter(new THREE.Vector3()),direction=anchor.clone().sub(assembledCenter);
    if(direction.lengthSq()<.0001)direction.set(Math.sin(groups.size*2.3),.2,Math.cos(groups.size*2.3));
    const group={id:component,anchor,offset:direction.normalize().multiplyScalar(modelScale*.24)};groups.set(component,group);
    members.forEach(piece=>piece.radialOffset.copy(group.offset));
    const button=document.createElement('button');button.className='scene-label';button.type='button';button.textContent=getComponent(component).name;button.onclick=()=>latest.current.onSelect(component,'');el.appendChild(button);groupLabels.push({button,group});
   }
   layout=createExplosionLayout(pieces,camera.aspect);pieces.forEach(piece=>piece.inventoryOffset.copy(layout!.pieces.get(piece.id)?.translation??new THREE.Vector3()));
   pieces.forEach(piece=>{
    const button=document.createElement('button');button.className='piece-marker';button.type='button';button.innerHTML=`<span>${String(piece.index).padStart(2,'0')}</span><strong>${piece.label}</strong>`;
    button.setAttribute('aria-label',`Inspect part ${piece.index}: ${piece.label}`);button.onclick=()=>latest.current.onSelect(piece.component,piece.id);el.appendChild(button);pieceMarkers.push({button,piece});
   });
   props.onPiecesChange(pieces.map(({id,label,link,component,index})=>({id,label,link,component,index})));props.onProgress(100);ready=true;fit(true);dirty=true;
  };

  const loadUpstreamUrdf=()=>{
   let parsed:THREE.Object3D|null=null,failed=0;
   const manager=new THREE.LoadingManager();manager.onProgress=(_url,loaded,total)=>{if(!disposed)props.onProgress(Math.min(96,Math.round(loaded/Math.max(total,1)*96)));};manager.onError=()=>{failed++;};
   manager.onLoad=()=>{if(disposed||!parsed)return;if(failed)props.onError(`${failed} visual ${failed===1?'asset':'assets'} could not be loaded from the upstream repository.`);finishModel(parsed);};
   const loader=new URDFLoader(manager);loader.packages=props.robot.model.packages;loader.parseVisual=true;loader.parseCollision=false;
   loader.load(props.robot.model.urdf,robot=>{parsed=robot;},undefined,error=>{if(!disposed)props.onError(error instanceof Error?error.message:'The upstream URDF could not be loaded.');});
  };
  new GLTFLoader().load(props.robot.model.asset,gltf=>finishModel(gltf.scene),event=>{if(!disposed&&event.total)props.onProgress(Math.min(96,Math.round(event.loaded/event.total*96)));},()=>{if(!disposed)loadUpstreamUrdf();});

  const resize=()=>{
   viewWidth=el.clientWidth;viewHeight=el.clientHeight;if(!viewWidth||!viewHeight)return;renderer.setSize(viewWidth,viewHeight,false);camera.aspect=viewWidth/viewHeight;camera.updateProjectionMatrix();
   if(ready){layout=createExplosionLayout(pieces,camera.aspect);pieces.forEach(piece=>piece.inventoryOffset.copy(layout!.pieces.get(piece.id)?.translation??new THREE.Vector3()));fit(true);}dirty=true;
  };
  const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const taps=new PointerTap(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const down=(event:PointerEvent)=>taps.down(event.pointerId,event.clientX,event.clientY,event.pointerType==='touch'?11:6),move=(event:PointerEvent)=>taps.move(event.pointerId,event.clientX,event.clientY),cancel=(event:PointerEvent)=>taps.cancel(event.pointerId);
  const up=(event:PointerEvent)=>{
   if(!taps.up(event.pointerId,event.clientX,event.clientY)||!ready)return;const rect=renderer.domElement.getBoundingClientRect();
   pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
   const hit=raycaster.intersectObjects(pieces.filter(piece=>piece.node.visible).map(piece=>piece.node),false)[0]?.object,piece=pieces.find(item=>item.id===hit?.userData.pieceId);
   if(piece)latest.current.onSelect(piece.component,piece.id);
  };
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointercancel',cancel);renderer.domElement.addEventListener('pointerup',up);

  const frame=(now:number)=>{
   if(disposed)return;
   raf=requestAnimationFrame(frame);
   if(document.hidden)return;
   const delta=Math.min((now-last)/1000,.05),target=latest.current.explode/100,oldAmount=amount;
   last=now;
   amount=matchMedia('(prefers-reduced-motion: reduce)').matches?target:THREE.MathUtils.damp(amount,target,7,delta);if(Math.abs(amount-target)<.0001)amount=target;
   if(previousExplosion!==latest.current.explode){previousExplosion=latest.current.explode;frameUntil=now+1300;}
   const radial=THREE.MathUtils.smoothstep(amount,.03,.55),inventory=THREE.MathUtils.smoothstep(amount,.44,1),moving=amount!==oldAmount;
   const stateKey=`${latest.current.selected}:${latest.current.selectedPiece}:${latest.current.isolated}:${latest.current.labels}:${latest.current.autoRotate}`;
   if(stateKey!==lastState){lastState=stateKey;dirty=true;frameUntil=now+500;}
   controls.autoRotate=latest.current.autoRotate&&!matchMedia('(prefers-reduced-motion: reduce)').matches;controls.update();if(frameUntil>now)fit(false);
   if(ready)for(const piece of pieces){
    piece.node.position.copy(piece.homePosition).addScaledVector(piece.radialOffset,radial*(1-inventory)).addScaledVector(piece.inventoryOffset,inventory);
    piece.node.visible=!latest.current.isolated||(latest.current.selectedPiece?piece.id===latest.current.selectedPiece:piece.component===latest.current.selected);
    const highlighted=latest.current.selectedPiece?piece.id===latest.current.selectedPiece:piece.component===latest.current.selected;
    for(const material of piece.materials){
     if(isColored(material))material.color.copy(material.userData.baseColor as THREE.Color).lerp(accent,highlighted ? .68 : 0);
     if(isEmissive(material)){material.emissive.copy(material.userData.baseEmissive as THREE.Color).lerp(accent,highlighted?1:0);material.emissiveIntensity=highlighted?3:material.userData.baseIntensity as number;}
    }
   }
   platform.visible=amount<.15&&!latest.current.isolated;ring.visible=platform.visible;ground.visible=inventory<.12&&!latest.current.isolated;grid.visible=ground.visible;renderer.shadowMap.enabled=inventory<.08&&!latest.current.isolated;
   const cameraChanged=camera.position.distanceToSquared(cameraPosition)>1e-10||1-Math.abs(camera.quaternion.dot(cameraQuaternion))>1e-10;
   if(dirty||moving||cameraChanged||latest.current.autoRotate){renderer.render(scene,camera);updateLabels();dirty=moving;}
   cameraPosition.copy(camera.position);cameraQuaternion.copy(camera.quaternion);
  };raf=requestAnimationFrame(frame);

  return()=>{
   disposed=true;cancelAnimationFrame(raf);observer.disconnect();controls.dispose();engine.current=null;pieceMarkers.forEach(({button})=>button.remove());groupLabels.forEach(({button})=>button.remove());
   renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointercancel',cancel);renderer.domElement.removeEventListener('pointerup',up);
   dispose(scene);environment.texture.dispose();renderer.dispose();renderer.domElement.remove();
  };
 },[props.robot.id]);

 return <div className="canvas-host" ref={host}/>;
});

export default RobotScene;
