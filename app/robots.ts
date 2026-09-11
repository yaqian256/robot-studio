export type CompanyId='unitree'|'fourier'|'agibot';
export type RobotKind='humanoid'|'quadruped';
export type ComponentId='sensors'|'head'|'torso'|'pelvis'|'upper-arm'|'forearm'|'hand'|'thigh'|'shank'|'foot'|'trunk'|'hip'|'calf';

export interface ComponentDefinition {
 id:ComponentId;
 name:string;
 category:string;
 description:string;
 principle:string;
}

export interface RobotDefinition {
 id:string;
 name:string;
 maker:string;
 company:CompanyId;
 kind:RobotKind;
 introduced:string;
 summary:string;
 height:string;
 mass:string;
 dof:string;
 license:string;
 formats:('URDF'|'MJCF')[];
 source:string;
 accent:string;
 morphology:{height:number;shoulders:number;body:number;limb:number};
 components:ComponentId[];
 model:{asset:string;urdf:string;packages:Record<string,string>;rotation:[number,number,number];redistributable:boolean};
}

export const companies:{id:CompanyId;name:string;origin:string}[]=[
 {id:'unitree',name:'Unitree',origin:'Hangzhou, China'},
 {id:'fourier',name:'Fourier',origin:'Shanghai, China'},
 {id:'agibot',name:'AgiBot',origin:'Shanghai, China'},
];

export const componentDefinitions:Record<ComponentId,ComponentDefinition>={
 sensors:{id:'sensors',name:'Perception array',category:'Sensing',description:'The visible perception package groups cameras and ranging sensors used to observe the environment.',principle:'Synchronized sensor streams are fused into estimates of geometry, motion, and nearby obstacles.'},
 head:{id:'head',name:'Head module',category:'Sensing',description:'The head houses the primary forward-facing perception hardware and protective shell.',principle:'A rigid mount keeps sensors calibrated relative to the robot body while the neck changes their viewing direction.'},
 torso:{id:'torso',name:'Torso core',category:'Structure',description:'The torso carries computing, power distribution, thermal hardware, and the shoulder interfaces.',principle:'A stiff central frame transfers arm and leg loads while protecting electronics and routing cables.'},
 pelvis:{id:'pelvis',name:'Pelvis assembly',category:'Structure',description:'The pelvis joins the torso to both legs and anchors the high-load hip actuators.',principle:'Closely spaced rotary joints produce roll, pitch, and yaw so each leg can place the foot in three dimensions.'},
 'upper-arm':{id:'upper-arm',name:'Upper arm',category:'Manipulation',description:'The upper arms connect shoulder joints to the elbows and carry wiring toward the wrists.',principle:'Multi-axis shoulders position each arm while elbow flexion changes reach and leverage.'},
 forearm:{id:'forearm',name:'Forearm',category:'Manipulation',description:'The forearm links the elbow to the wrist and supports the terminal hand or end effector.',principle:'Compact wrist axes orient the end effector independently from the larger shoulder and elbow motion.'},
 hand:{id:'hand',name:'Hands',category:'Manipulation',description:'The terminal manipulators provide contact surfaces for carrying, bracing, and interacting with objects.',principle:'Depending on configuration, passive pads or actuated fingers turn wrist motion into stable contact and grasping.'},
 thigh:{id:'thigh',name:'Upper legs',category:'Locomotion',description:'The upper leg links carry loads from hip actuators toward the knee joints.',principle:'Hip torque accelerates the body and controls lateral balance while the knee changes effective leg length.'},
 shank:{id:'shank',name:'Lower legs',category:'Locomotion',description:'The lower legs connect each knee to an ankle and place the feet beneath the body.',principle:'Knee and ankle coordination absorbs impact, clears the ground, and regulates stance height.'},
 foot:{id:'foot',name:'Feet',category:'Contact',description:'The feet are the robot’s contact interface with the ground.',principle:'A broad sole and controlled ankle maintain friction and shift the center of pressure during each step.'},
 trunk:{id:'trunk',name:'Main trunk',category:'Structure',description:'The trunk protects batteries, computers, motor drives, and the main load-bearing frame.',principle:'A rigid body keeps the four leg attachment points aligned while distributing loads between them.'},
 hip:{id:'hip',name:'Hip modules',category:'Locomotion',description:'Four hip modules move each leg outward and fore-aft from the trunk.',principle:'Paired rotary axes establish the leg plane and swing direction before the knee controls extension.'},
 calf:{id:'calf',name:'Calf links',category:'Locomotion',description:'The lower links connect knee actuators to the compact ground contacts.',principle:'Long, light links reduce swing inertia while transmitting force between the knee and foot.'},
};

const humanoid:ComponentId[]=['head','sensors','torso','pelvis','upper-arm','forearm','hand','thigh','shank','foot'];
const quadruped:ComponentId[]=['sensors','trunk','hip','thigh','calf','foot'];
const raw='https://raw.githubusercontent.com/';
const unitreeRoot=`${raw}unitreerobotics/unitree_ros/master/robots`;
const unitreeModel=(id:string,description:string,file:string)=>({asset:`/models/robots/${id}.glb?v=urdf-1`,urdf:`${unitreeRoot}/${description}/${file}`,packages:{[description]:`${unitreeRoot}/${description}/`},rotation:[-Math.PI/2,0,0] as [number,number,number],redistributable:true});
const relativeModel=(id:string,urdf:string,redistributable=true)=>({asset:`/models/robots/${id}${redistributable?'':'.local'}.glb?v=urdf-1`,urdf,packages:{},rotation:[-Math.PI/2,0,0] as [number,number,number],redistributable});

export const robots:RobotDefinition[]=[
 {id:'unitree-g1',name:'G1',maker:'Unitree Robotics',company:'unitree',kind:'humanoid',introduced:'2024',summary:'A compact general-purpose humanoid platform designed for embodied intelligence research.',height:'1.32 m',mass:'35 kg',dof:'23–43',license:'BSD-3-Clause',formats:['MJCF','URDF'],source:'https://github.com/unitreerobotics/unitree_ros/tree/master/robots/g1_description',accent:'#b8ff44',morphology:{height:1.32,shoulders:.42,body:.28,limb:.9},components:humanoid,model:unitreeModel('unitree-g1','g1_description','g1_29dof.urdf')},
 {id:'unitree-g1-23dof',name:'G1 (23 DoF)',maker:'Unitree Robotics',company:'unitree',kind:'humanoid',introduced:'2024',summary:'A lighter-weight kinematic variant of the G1 humanoid with a simplified 23 degree-of-freedom arm and hand configuration.',height:'1.32 m',mass:'35 kg',dof:'23',license:'BSD-3-Clause',formats:['URDF'],source:'https://github.com/unitreerobotics/unitree_ros/tree/master/robots/g1_description',accent:'#b8ff44',morphology:{height:1.32,shoulders:.42,body:.28,limb:.9},components:humanoid,model:unitreeModel('unitree-g1-23dof','g1_description','g1_23dof.urdf')},
 {id:'unitree-h1',name:'H1',maker:'Unitree Robotics',company:'unitree',kind:'humanoid',introduced:'2023',summary:'A full-size electric humanoid focused on dynamic locomotion and rapid whole-body motion.',height:'1.80 m',mass:'47 kg',dof:'19–27',license:'BSD-3-Clause',formats:['MJCF','URDF'],source:'https://github.com/unitreerobotics/unitree_ros/tree/master/robots/h1_description',accent:'#c7f36b',morphology:{height:1.8,shoulders:.5,body:.31,limb:1.12},components:humanoid,model:unitreeModel('unitree-h1','h1_description','urdf/h1.urdf')},
 {id:'unitree-h1-2',name:'H1-2',maker:'Unitree Robotics',company:'unitree',kind:'humanoid',introduced:'2024',summary:'An upgraded full-size humanoid with dexterous hands for whole-body manipulation research.',height:'1.80 m',mass:'60 kg',dof:'27–45',license:'BSD-3-Clause',formats:['URDF'],source:'https://github.com/unitreerobotics/unitree_ros/tree/master/robots/h1_2_description',accent:'#c7f36b',morphology:{height:1.8,shoulders:.52,body:.32,limb:1.14},components:humanoid,model:unitreeModel('unitree-h1-2','h1_2_description','h1_2.urdf')},
 {id:'unitree-h1-2-handless',name:'H1-2 Handless',maker:'Unitree Robotics',company:'unitree',kind:'humanoid',introduced:'2024',summary:'The H1-2 humanoid variant with simplified wrist end effectors instead of dexterous hands.',height:'1.80 m',mass:'59 kg',dof:'27–33',license:'BSD-3-Clause',formats:['URDF'],source:'https://github.com/unitreerobotics/unitree_ros/tree/master/robots/h1_2_description',accent:'#c7f36b',morphology:{height:1.8,shoulders:.52,body:.32,limb:1.14},components:humanoid,model:unitreeModel('unitree-h1-2-handless','h1_2_description','h1_2_handless.urdf')},
 {id:'unitree-h1-2-ftp-hand',name:'H1-2 FTP Hand',maker:'Unitree Robotics',company:'unitree',kind:'humanoid',introduced:'2024',summary:'The H1-2 humanoid variant fitted with FTP dexterous hands for fine manipulation tasks.',height:'1.80 m',mass:'61 kg',dof:'27–45',license:'BSD-3-Clause',formats:['URDF'],source:'https://github.com/unitreerobotics/unitree_ros/tree/master/robots/h1_2_description',accent:'#c7f36b',morphology:{height:1.8,shoulders:.52,body:.32,limb:1.14},components:humanoid,model:unitreeModel('unitree-h1-2-ftp-hand','h1_2_description','h1_2_with_FTP_hand.urdf')},
 {id:'fourier-gr1',name:'GR-1',maker:'Fourier',company:'fourier',kind:'humanoid',introduced:'2023',summary:'A full-size humanoid built for rehabilitation, research, and general-purpose manipulation.',height:'1.65 m',mass:'55 kg',dof:'40',license:'GPL-3.0',formats:['URDF'],source:'https://github.com/FFTAI/Wiki-GRx-Models/tree/master/GRX/GR1',accent:'#ffb45e',morphology:{height:1.65,shoulders:.52,body:.34,limb:1},components:humanoid,model:relativeModel('fourier-gr1',`${raw}FFTAI/Wiki-GRx-Models/master/GRX/GR1/gr1t2/basic_urdf/gr1t2_dummy_hand.urdf`)},
 {id:'fourier-n1',name:'N1',maker:'Fourier',company:'fourier',kind:'humanoid',introduced:'2025',summary:'An open-source humanoid platform aimed at accessible research and developer experimentation.',height:'1.30 m',mass:'38 kg',dof:'23',license:'Apache-2.0',formats:['URDF'],source:'https://github.com/FFTAI/Wiki-GRx-Models/tree/FourierN1/N1',accent:'#ffc56f',morphology:{height:1.3,shoulders:.43,body:.3,limb:.82},components:humanoid,model:relativeModel('fourier-n1',`${raw}FFTAI/Wiki-GRx-Models/FourierN1/N1/urdf/N1_raw.urdf`)},
 {id:'fourier-gr2',name:'GR-2',maker:'Fourier',company:'fourier',kind:'humanoid',introduced:'2024',summary:'A taller full-size humanoid in the GR series built for advanced whole-body manipulation research.',height:'1.75 m',mass:'63 kg',dof:'53',license:'GPL-3.0',formats:['URDF'],source:'https://github.com/FFTAI/Wiki-GRx-Models/tree/master/GRX/GR2',accent:'#ffb45e',morphology:{height:1.75,shoulders:.54,body:.35,limb:1.05},components:humanoid,model:relativeModel('fourier-gr2',`${raw}FFTAI/Wiki-GRx-Models/master/GRX/GR2/gr2v3_8_7/basic_urdf/gr2v3_8_7.urdf`)},
 {id:'fourier-gr3',name:'GR-3',maker:'Fourier',company:'fourier',kind:'humanoid',introduced:'2025',summary:'The latest generation GR humanoid platform with refined actuation for dynamic locomotion and manipulation.',height:'1.65 m',mass:'56 kg',dof:'45',license:'GPL-3.0',formats:['URDF'],source:'https://github.com/FFTAI/Wiki-GRx-Models/tree/master/GRX/GR3',accent:'#ffb45e',morphology:{height:1.65,shoulders:.52,body:.34,limb:1},components:humanoid,model:relativeModel('fourier-gr3',`${raw}FFTAI/Wiki-GRx-Models/master/GRX/GR3/gr3v2_1_1/basic_urdf/gr3v2_1_1.urdf`)},
 {id:'agibot-x1',name:'X1',maker:'AgiBot',company:'agibot',kind:'humanoid',introduced:'2024',summary:'A compact open research humanoid for reinforcement learning and whole-body control.',height:'1.33 m',mass:'33 kg',dof:'23',license:'No license declared',formats:['MJCF','URDF'],source:'https://github.com/AgibotTech/agibot_x1_train/tree/main/resources/robots/x1',accent:'#56d6ff',morphology:{height:1.33,shoulders:.44,body:.29,limb:.84},components:humanoid,model:relativeModel('agibot-x1',`${raw}AgibotTech/agibot_x1_train/main/resources/robots/x1/urdf/x1.urdf`,false)},
 {id:'unitree-a1',name:'A1',maker:'Unitree Robotics',company:'unitree',kind:'quadruped',introduced:'2020',summary:'A compact high-performance quadruped widely used in locomotion research.',height:'0.40 m',mass:'12 kg',dof:'12',license:'MPL-2.0',formats:['MJCF','URDF'],source:'https://github.com/unitreerobotics/unitree_ros/tree/master/robots/a1_description',accent:'#b8ff44',morphology:{height:.4,shoulders:.32,body:.55,limb:.52},components:quadruped,model:unitreeModel('unitree-a1','a1_description','urdf/a1.urdf')},
 {id:'unitree-aliengo',name:'Aliengo',maker:'Unitree Robotics',company:'unitree',kind:'quadruped',introduced:'2019',summary:'A medium-size quadruped research platform with larger payload and outdoor capability.',height:'0.60 m',mass:'24 kg',dof:'12',license:'MPL-2.0',formats:['MJCF','URDF'],source:'https://github.com/unitreerobotics/unitree_ros/tree/master/robots/aliengo_description',accent:'#b8ff44',morphology:{height:.6,shoulders:.4,body:.72,limb:.7},components:quadruped,model:unitreeModel('unitree-aliengo','aliengo_description','urdf/aliengo.urdf')},
 {id:'unitree-b1',name:'B1',maker:'Unitree Robotics',company:'unitree',kind:'quadruped',introduced:'2021',summary:'An industrial quadruped designed for inspection, payload carrying, and difficult terrain.',height:'0.60 m',mass:'50 kg',dof:'12',license:'BSD-3-Clause',formats:['URDF'],source:'https://github.com/unitreerobotics/unitree_ros/tree/master/robots/b1_description',accent:'#b8ff44',morphology:{height:.6,shoulders:.48,body:.82,limb:.72},components:quadruped,model:unitreeModel('unitree-b1','b1_description','xacro/b1.urdf')},
 {id:'unitree-b2',name:'B2',maker:'Unitree Robotics',company:'unitree',kind:'quadruped',introduced:'2023',summary:'A heavy-duty industrial quadruped with high torque, speed, and obstacle capability.',height:'0.65 m',mass:'60 kg',dof:'12',license:'BSD-3-Clause',formats:['URDF'],source:'https://github.com/unitreerobotics/unitree_ros/tree/master/robots/b2_description',accent:'#b8ff44',morphology:{height:.65,shoulders:.52,body:.88,limb:.76},components:quadruped,model:unitreeModel('unitree-b2','b2_description','urdf/b2_description.urdf')},
 {id:'unitree-go1',name:'Go1',maker:'Unitree Robotics',company:'unitree',kind:'quadruped',introduced:'2021',summary:'A small agile quadruped that helped make legged robotics broadly accessible.',height:'0.40 m',mass:'12 kg',dof:'12',license:'BSD-3-Clause',formats:['MJCF','URDF'],source:'https://github.com/unitreerobotics/unitree_mujoco/tree/main/data/go1',accent:'#b8ff44',morphology:{height:.4,shoulders:.31,body:.55,limb:.5},components:quadruped,model:unitreeModel('unitree-go1','go1_description','urdf/go1.urdf')},
 {id:'unitree-go2',name:'Go2',maker:'Unitree Robotics',company:'unitree',kind:'quadruped',introduced:'2023',summary:'A compact consumer and research quadruped with upgraded sensing and athletic motion.',height:'0.40 m',mass:'15 kg',dof:'12',license:'BSD-3-Clause',formats:['MJCF','URDF'],source:'https://github.com/unitreerobotics/unitree_ros/tree/master/robots/go2_description',accent:'#b8ff44',morphology:{height:.4,shoulders:.32,body:.58,limb:.52},components:quadruped,model:unitreeModel('unitree-go2','go2_description','urdf/go2_description.urdf')},
];

export const getComponent=(id:ComponentId)=>componentDefinitions[id];
