import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,Box,ChevronLeft,ChevronRight,Expand,Focus,Info,Layers3,Maximize2,Minimize2,Minus,Pause,Plus,Rotate3d,RotateCcw,Search,Tag,X} from 'lucide-react';
import RobotScene,{type SceneHandle} from './robot-scene';
import type {PieceSummary} from './model-pieces';
import {companies,getComponent,robots,type CompanyId,type ComponentId,type RobotKind} from './robots';

type DetailTab='overview'|'mechanism';

export default function Home(){
 const [robotId,setRobotId]=useState('unitree-g1');
 const [company,setCompany]=useState<CompanyId|'all'>('all');
 const [kind,setKind]=useState<RobotKind|'all'>('all');
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState<ComponentId>('torso');
 const [selectedPiece,setSelectedPiece]=useState('');
 const [pieces,setPieces]=useState<PieceSummary[]>([]);
 const [progress,setProgress]=useState(0);
 const [loadError,setLoadError]=useState('');
 const [explode,setExplode]=useState(0);
 const [isolated,setIsolated]=useState(false);
 const [labels,setLabels]=useState(false);
 const [rotate,setRotate]=useState(false);
 const [catalogOpen,setCatalogOpen]=useState(true);
 const [detailsOpen,setDetailsOpen]=useState(true);
 const [aboutOpen,setAboutOpen]=useState(false);
 const [fullscreen,setFullscreen]=useState(false);
 const [tab,setTab]=useState<DetailTab>('overview');
 const scene=useRef<SceneHandle>(null);
 const root=useRef<HTMLElement>(null);
 const robot=robots.find(item=>item.id===robotId)??robots[0];
 const detail=getComponent(selected);
 const piece=pieces.find(item=>item.id===selectedPiece);
 const componentIndex=Math.max(0,robot.components.indexOf(selected));
 const filtered=useMemo(()=>{
  const term=query.trim().toLowerCase();
  return robots.filter(item=>(company==='all'||item.company===company)&&(kind==='all'||item.kind===kind)&&(!term||`${item.name} ${item.maker} ${item.summary}`.toLowerCase().includes(term)));
 },[company,kind,query]);
 useEffect(()=>{
  const syncFullscreen=()=>setFullscreen(document.fullscreenElement===root.current);
  document.addEventListener('fullscreenchange',syncFullscreen);
  return()=>document.removeEventListener('fullscreenchange',syncFullscreen);
 },[]);
 useEffect(()=>{if(matchMedia('(max-width: 760px)').matches)setDetailsOpen(false);},[]);

 const selectRobot=(id:string)=>{
  const next=robots.find(item=>item.id===id);
  if(!next)return;
  const compact=matchMedia('(max-width: 760px)').matches;
  if(id!==robotId){
   setRobotId(id);setSelected(next.components[0]);setSelectedPiece('');setPieces([]);setProgress(0);setLoadError('');setIsolated(false);setExplode(0);setTab('overview');setDetailsOpen(!compact);setAboutOpen(false);
  }
  if(compact)setCatalogOpen(false);
 };
 const selectComponent=(id:ComponentId)=>{setSelected(id);setSelectedPiece('');setDetailsOpen(true);setAboutOpen(false);setTab('overview');};
 const selectPiece=(component:ComponentId,id:string)=>{setSelected(component);setSelectedPiece(id);setDetailsOpen(true);setAboutOpen(false);setTab('overview');};
 const stepComponent=(direction:-1|1)=>selectComponent(robot.components[(componentIndex+direction+robot.components.length)%robot.components.length]);
 const reset=()=>{setExplode(0);setIsolated(false);setRotate(false);scene.current?.reset();};
 const toggleFullscreen=async()=>{if(document.fullscreenElement)await document.exitFullscreen();else await root.current?.requestFullscreen?.();};

 return <main className="studio" ref={root}>
  <section className="stage" aria-label={`${robot.maker} ${robot.name} explorer`}>
   <RobotScene robot={robot} selected={selected} selectedPiece={selectedPiece} explode={explode} isolated={isolated} labels={labels} autoRotate={rotate} onSelect={selectPiece} onPiecesChange={setPieces} onProgress={setProgress} onError={setLoadError} ref={scene}/>
  </section>
  <div className="ambient ambient-a"/><div className="ambient ambient-b"/>
  {progress<100&&!loadError&&<div className="model-loading" role="status"><span style={{'--progress':`${progress}%`} as React.CSSProperties}/><strong>Loading complete URDF</strong><em>{progress}% · visual meshes from upstream</em></div>}
  {loadError&&progress<100&&<div className="model-error" role="alert"><strong>Model unavailable</strong><span>{loadError}</span><a href={robot.source} target="_blank" rel="noreferrer">Check upstream source <ArrowUpRight size={12}/></a></div>}
  {loadError&&progress===100&&<div className="asset-warning" role="status">{loadError}</div>}

  <header className="identity">
   <button className="brand" onClick={()=>setCatalogOpen(true)} aria-label="Open robot catalog">
    <span className="brand-mark"><span/><span/><span/></span>
    <span><strong>ROBOT</strong><em>STUDIO</em></span>
   </button>
   <div className="model-title">
    <span>{robot.maker.toUpperCase()} / {robot.kind.toUpperCase()}</span>
    <h1>{robot.name}</h1>
   </div>
  </header>

  <nav className="top-actions" aria-label="Application controls">
   <button onClick={()=>{setAboutOpen(!aboutOpen);setDetailsOpen(false);}} className={aboutOpen?'active':''}><Info size={17}/><span>About</span></button>
   <button onClick={()=>void toggleFullscreen()} title={fullscreen?'Exit fullscreen':'Fullscreen'} aria-label={fullscreen?'Exit fullscreen':'Enter fullscreen'}>{fullscreen?<Minimize2 size={16}/>:<Maximize2 size={16}/>}</button>
  </nav>

  {!catalogOpen&&<button className="open-catalog floating" onClick={()=>setCatalogOpen(true)}><Layers3 size={16}/> Catalog <span>{robots.length}</span></button>}

  {catalogOpen&&<aside className="catalog floating" aria-label="Robot catalog">
   <div className="panel-head">
    <div><span>FLEET INDEX</span><strong>{filtered.length} systems</strong></div>
    <button onClick={()=>setCatalogOpen(false)} aria-label="Close catalog"><ChevronLeft size={17}/></button>
   </div>
   <div className="company-filter" aria-label="Filter by company">
    <button className={company==='all'?'active':''} onClick={()=>setCompany('all')}>All</button>
    {companies.map(item=><button key={item.id} className={company===item.id?'active':''} onClick={()=>setCompany(item.id)}>{item.name}</button>)}
   </div>
   <div className="kind-filter">
    <button className={kind==='all'?'active':''} onClick={()=>setKind('all')}>All forms</button>
    <button className={kind==='humanoid'?'active':''} onClick={()=>setKind('humanoid')}>Humanoids</button>
    <button className={kind==='quadruped'?'active':''} onClick={()=>setKind('quadruped')}>Quadrupeds</button>
   </div>
   <label className="search"><Search size={14}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search models…" aria-label="Search robot models"/>{query&&<button onClick={()=>setQuery('')} aria-label="Clear search"><X size={13}/></button>}</label>
   <div className="robot-list">
    {filtered.map((item,index)=><button key={item.id} onClick={()=>selectRobot(item.id)} className={`robot-row ${item.id===robot.id?'selected':''}`}>
     <span className="robot-index">{String(index+1).padStart(2,'0')}</span>
     <span className="robot-copy"><strong>{item.name}</strong><em>{item.maker} · {item.kind}</em></span>
     <span className="robot-swatch" style={{'--swatch':item.accent} as React.CSSProperties}/>
     <ChevronRight size={13}/>
    </button>)}
    {!filtered.length&&<div className="empty"><Search size={20}/><strong>No systems found</strong><span>Adjust the company, form, or search.</span></div>}
   </div>
  </aside>}

  {detailsOpen&&<aside className="details floating" aria-label="Component details">
   <div className="panel-head">
    <div><span>ASSEMBLY</span><strong>{pieces.length?`${pieces.length} visual pieces`:`${robot.components.length} groups`}</strong></div>
    <button onClick={()=>setDetailsOpen(false)} aria-label="Close component details"><X size={17}/></button>
   </div>
   <div className="details-body">
    <div className="component-navigator">
     <button onClick={()=>stepComponent(-1)} aria-label="Previous component"><ChevronLeft size={15}/></button>
     <label><span>Component {String(componentIndex+1).padStart(2,'0')} / {String(robot.components.length).padStart(2,'0')}</span><select value={selected} onChange={event=>selectComponent(event.target.value as ComponentId)} aria-label="Select robot component">{robot.components.map(id=><option key={id} value={id}>{getComponent(id).name}</option>)}</select></label>
     <button onClick={()=>stepComponent(1)} aria-label="Next component"><ChevronRight size={15}/></button>
    </div>
    <span className="detail-kicker">{piece?'URDF VISUAL MESH':'SELECTED ASSEMBLY'}</span>
    <h2>{piece?.label??detail.name}</h2>
    <div className="tabs" role="tablist"><button role="tab" aria-selected={tab==='overview'} onClick={()=>setTab('overview')}>Overview</button><button role="tab" aria-selected={tab==='mechanism'} onClick={()=>setTab('mechanism')}>How it works</button></div>
    <p>{piece&&tab==='overview'?`This independently loaded visual belongs to the “${piece.link}” URDF link. It is one of ${pieces.length} selectable visual pieces in this model.`:tab==='overview'?detail.description:detail.principle}</p>
    <dl>
     <div><dt>Robot</dt><dd>{robot.name}</dd></div>
     <div><dt>Maker</dt><dd>{robot.maker}</dd></div>
     <div><dt>Form</dt><dd>{robot.kind}</dd></div>
     {piece&&<div><dt>URDF link</dt><dd>{piece.link}</dd></div>}
    </dl>
    {pieces.length>0&&<label className="piece-select"><span>Individual visual piece</span><select value={selectedPiece||'group'} onChange={event=>{const next=pieces.find(item=>item.id===event.target.value);if(next)selectPiece(next.component,next.id);else selectComponent(selected);}}><option value="group">All pieces in {detail.name}</option>{pieces.filter(item=>item.component===selected).map(item=><option value={item.id} key={item.id}>{String(item.index).padStart(2,'0')} · {item.label}</option>)}</select></label>}
    <button className={`isolate ${isolated?'active':''}`} onClick={()=>setIsolated(!isolated)} aria-pressed={isolated}><Focus size={15}/>{isolated?'Show full assembly':'Isolate component'}</button>
   </div>
  </aside>}

  {aboutOpen&&<aside className="about floating" aria-label="About selected robot">
   <div className="panel-head"><div><span>MODEL PROFILE</span><strong>{robot.introduced}</strong></div><button onClick={()=>setAboutOpen(false)} aria-label="Close about panel"><X size={17}/></button></div>
   <div className="about-body"><h2>{robot.maker}<br/><strong>{robot.name}</strong></h2><p>{robot.summary}</p>
    <div className="stat-grid"><div><span>Height</span><strong>{robot.height}</strong></div><div><span>Mass</span><strong>{robot.mass}</strong></div><div><span>Visual pieces</span><strong>{pieces.length||'Loading'}</strong></div><div><span>Joints / DoF</span><strong>{robot.dof}</strong></div></div>
    <div className="format-row">{robot.formats.map(format=><span key={format}>{format}</span>)}<span><Tag size={10}/>{robot.license}</span></div>
    <p className="scope-note">The complete URDF and visual meshes load directly from the upstream repository. A visual piece is not necessarily an OEM service part.</p>
    <a href={robot.source} target="_blank" rel="noreferrer">Open robot description <ArrowUpRight size={13}/></a>
   </div>
  </aside>}

  <nav className="view-tools floating" aria-label="3D view controls">
   <button className={detailsOpen?'active':''} onClick={()=>{setDetailsOpen(!detailsOpen);setAboutOpen(false);}} aria-pressed={detailsOpen} aria-label="Toggle component inspector" title="Components"><Layers3 size={17}/></button>
   <span/>
   <button onClick={()=>scene.current?.zoom(.84)} aria-label="Zoom in" title="Zoom in"><Plus size={17}/></button>
   <button onClick={()=>scene.current?.zoom(1.18)} aria-label="Zoom out" title="Zoom out"><Minus size={17}/></button>
   <span/>
   <button className={rotate?'active':''} onClick={()=>setRotate(!rotate)} aria-pressed={rotate} aria-label="Toggle rotation">{rotate?<Pause size={16}/>:<Rotate3d size={17}/>}</button>
   <button onClick={reset} aria-label="Reset assembly and view"><RotateCcw size={16}/></button>
  </nav>

  <section className="explode-dock floating" aria-label="Assembly explosion controls">
   <button className={`assembly-button ${explode===0?'active':''}`} onClick={()=>{setExplode(0);setIsolated(false);}} aria-label="Assemble robot"><Box size={17}/><span>Assemble</span></button>
   <div className="explode-control"><div className="slider-caption"><label htmlFor="explode-range">Separate</label><output>{explode===100?`${pieces.length} pieces`:`${explode}%`}</output></div><input id="explode-range" type="range" min="0" max="100" value={explode} disabled={progress<100} onChange={event=>setExplode(Number(event.target.value))} aria-label="Explode robot assembly"/></div>
   <button className={`assembly-button ${explode===100?'active':''}`} onClick={()=>{setExplode(100);setIsolated(false);}} aria-label="Separate all robot parts"><Expand size={17}/><span>All parts</span></button>
   <div className="dock-divider"/>
   <label className="labels-toggle"><input type="checkbox" checked={labels} onChange={event=>setLabels(event.target.checked)}/><span>Labels</span></label>
  </section>
 </main>;
}
