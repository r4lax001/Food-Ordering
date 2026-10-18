import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Vector3 } from 'three';
import { tablePositions, tableStatus, tableStatusLabels } from './restaurant-layout';
import './restaurant3d.css';

function Block({ position, size, color, ...props }) {
  return <mesh position={position} castShadow receiveShadow {...props}><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={.7} /></mesh>;
}
function Plant({ position }) {
  return <group position={position}>
    <mesh position={[0,.24,0]} castShadow><cylinderGeometry args={[.22,.17,.48,16]} /><meshStandardMaterial color="#bb8259" /></mesh>
    {[0,1,2,3,4].map(i => <mesh key={i} position={[Math.sin(i*2.4)*.17,.65+(i%2)*.16,Math.cos(i*2.4)*.17]} rotation={[.3,i,.4]} scale={[.16,.35,.13]} castShadow><sphereGeometry args={[1,12,8]} /><meshStandardMaterial color={i%2?'#668650':'#87a46c'} /></mesh>)}
  </group>;
}
function Room() {
 return <group>
   <Block position={[0,-.18,0]} size={[10.5,.35,9.5]} color="#c7a980" />
   <Block position={[0,.01,0]} size={[10,.06,9]} color="#f2e6d3" />
   {Array.from({length:19},(_,i)=><Block key={i} position={[-4.75+i*.5,.045,0]} size={[.012,.008,9]} color="#e2cfb2" />)}
   <Block position={[0,1.1,-4.6]} size={[10.4,2.2,.15]} color="#f4eadd" />
   <Block position={[-5.1,.65,0]} size={[.15,1.3,9.2]} color="#eee0cb" />
   {[-2.7,-.7,1.3].map(z=><group key={z}><Block position={[-5,1.5,z]} size={[.06,1.1,1.6]} color="#bcdad7" /><Block position={[-4.94,.98,z]} size={[.25,.1,1.8]} color="#fff7e9" /><Block position={[-4.93,1.5,z]} size={[.09,1.12,.035]} color="#fdf7ee" /></group>)}
   <Block position={[-2.7,.56,-3.65]} size={[3.1,1.08,.8]} color="#ba8a5b" />
   <Block position={[-2.7,1.14,-3.65]} size={[3.3,.12,.95]} color="#fff6e8" />
   <Block position={[-2.05,1.32,-3.65]} size={[.4,.28,.32]} color="#50554e" />
   <Block position={[3.7,.9,-4.47]} size={[1.0,1.8,.07]} color="#aab39a" />
   <Block position={[4.02,.9,-4.4]} size={[.04,.13,.04]} color="#695a43" />
   <Block position={[0,.052,.2]} size={[1.35,.012,7.9]} color="#e7dbc6" />
   <Block position={[0,.05,4.5]} size={[1.5,.03,.28]} color="#d88c52" />
   <Plant position={[-4.4,0,3.7]} /><Plant position={[4.4,0,3.7]} /><Plant position={[-4.45,0,-3.65]} />
 </group>;
}

// DOM labels stay crisp and keyboard accessible; their positions follow the camera.
function Label({ position, host, children, className = '' }) {
  const element = useRef(null);
  const domRoot = useRef(null);
  useLayoutEffect(() => {
    if (!host) return;
    const node = document.createElement('div');
    node.className = 'room3d-label ' + className;
    element.current = node;
    host.appendChild(node);
    const root = createRoot(node);
    domRoot.current = root;
    return () => { element.current = null; domRoot.current = null; node.remove(); queueMicrotask(() => root.unmount()); };
  }, [host, className]);
  useEffect(() => { domRoot.current?.render(children); }, [children, host]);
  const { camera, size } = useThree();
  const point = useMemo(() => new Vector3(...position), [position[0],position[1],position[2]]);
  const projected = useMemo(() => new Vector3(), []);
  const update = () => {
    if (!element.current) return;
    camera.updateMatrixWorld();
    projected.copy(point).project(camera);
    element.current.style.left = `${(projected.x+1)*size.width/2}px`;
    element.current.style.top = `${(1-projected.y)*size.height/2}px`;
    element.current.style.visibility = Math.abs(projected.x)>1 || Math.abs(projected.y)>1 || Math.abs(projected.z)>1 ? 'hidden' : 'visible';
  };
  useLayoutEffect(update);
  useFrame(update);
  return null;
}
function DiningTable({ table, selected, state, onSelect, busy, host }) {
  const [hover, setHover] = useState(false);
  const [px,py] = tablePositions[table.table_number];
  const x=((px+74)/980-.5)*10, z=((py+85)/840-.5)*9;
  const enabled = state==='available' && !busy;
  const color=selected?'#f47c32':state==='full'?'#ce5b54':state==='too-small'?'#a59c8e':'#649e71';
  const seats=Math.min(20,table.capacity), perSide=Math.ceil(seats/2);
  const width=seats<=2?.95:seats<=4?1.25:1.48;
  return <>
    <group position={[x,hover&&enabled?.06:0,z]} onPointerOver={e=>{e.stopPropagation();setHover(true)}} onPointerOut={()=>setHover(false)} onClick={e=>{e.stopPropagation();if(enabled && e.delta<5)onSelect(table.id)}}>
      <Block position={[0,.78,0]} size={[width,.14,.77]} color={selected?'#f6bf80':'#e2bd87'} />
      {[-1,1].flatMap(a=>[-1,1].map(b=><Block key={`${a}${b}`} position={[a*(width/2-.12),.38,b*.27]} size={[.08,.7,.08]} color="#9c744d" />))}
      {Array.from({length:seats},(_,i)=>{
        const side=i<perSide?-1:1, count=side===-1?perSide:seats-perSide;
        const seatX=((i%perSide+.5)/count-.5)*width;
        return <group key={i} position={[seatX,0,side*.63]}>
          <Block position={[0,.43,0]} size={[Math.min(.34,width/count-.04),.1,.32]} color={color} />
          <Block position={[0,.68,side*.13]} size={[Math.min(.34,width/count-.04),.44,.07]} color={color} />
          {[-1,1].map(n=><Block key={n} position={[n*.1,.2,0]} size={[.045,.4,.24]} color="#a48460" />)}
        </group>;
      })}
      {[-1,1].map(n=><mesh key={n} position={[n*width*.26,.865,0]} receiveShadow><cylinderGeometry args={[.14,.14,.025,20]} /><meshStandardMaterial color="#fffaf0" roughness={.35} /></mesh>)}
      <mesh position={[0,.92,0]} castShadow><cylinderGeometry args={[.045,.06,.15,10]} /><meshStandardMaterial color="#bd8966" /></mesh>
      <mesh position={[0,1.04,0]} scale={[.08,.14,.08]}><sphereGeometry args={[1,8,6]} /><meshStandardMaterial color="#629453" /></mesh>
      <mesh position={[0,.06,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.85,.89,48]} /><meshBasicMaterial color={color} transparent opacity={selected?.95:.3} /></mesh>
    </group>
    <Label host={host} position={[x,1.52,z]}>
      <button type="button" className={`room3d-table status-${state} ${selected?'selected':''}`} disabled={!enabled}
        aria-label={`โต๊ะ ${table.table_number} ${table.capacity} ที่นั่ง · ${tableStatusLabels[state]}`} aria-pressed={selected}
        onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocus={()=>setHover(true)} onBlur={()=>setHover(false)} onClick={()=>onSelect(table.id)}>
        <strong>{table.table_number} <span>· {table.capacity} ที่</span></strong><small>{selected?'✓ เลือกแล้ว':tableStatusLabels[state]}</small>
      </button>
    </Label>
  </>;
}
function CameraControls({ controller }) {
 const {camera,gl,size,invalidate}=useThree();
 useEffect(()=>{
   const controls=new OrbitControls(camera,gl.domElement);
   controls.target.set(0,0,0); controls.enablePan=false; controls.enableZoom=false;
   controls.minPolarAngle=.35; controls.maxPolarAngle=1.05; controls.minAzimuthAngle=-.65; controls.maxAzimuthAngle=.95;
   controls.addEventListener('change',invalidate);
   const compact = size.width < 1000;
   const fit = Math.min(size.width / (compact ? 11.4 : 16), size.height / 14);
   controller.current={
     reset(){camera.position.set(...(compact ? [0,16,8] : [8,12,13]));camera.zoom=fit;camera.updateProjectionMatrix();controls.target.set(0,0,0);controls.update();invalidate()},
     zoom(amount){camera.zoom=Math.max(fit*.8,Math.min(fit*2.2,camera.zoom*amount));camera.updateProjectionMatrix();invalidate()},
     rotate(amount){controls.rotateLeft(amount);controls.update();invalidate()},
   };
   controller.current.reset();
   return ()=>{controller.current=null;controls.dispose()};
 },[camera,gl,size.width,size.height,invalidate,controller]);
 return null;
}
export default function RestaurantScene({ roomTables, tables, freeTables, guests, selected, onSelect, busy, fallback }) {
 const [host,setHost]=useState(null), [failed,setFailed]=useState(false);
 const controller=useRef(null);
 const free=new Set(freeTables.map(t=>t.id));
 const available=new Set(tables.map(t=>t.id));
 if(failed)return fallback;
 return <div className="room3d">
   <div className="room3d-actions" role="group" aria-label="ปรับมุมมองร้านสามมิติ">
     <button type="button" aria-label="หมุนร้านไปทางซ้าย" onClick={()=>controller.current?.rotate(.2)}>↶</button>
     <button type="button" aria-label="หมุนร้านไปทางขวา" onClick={()=>controller.current?.rotate(-.2)}>↷</button>
     <button type="button" aria-label="ขยายร้านสามมิติ" onClick={()=>controller.current?.zoom(1.2)}>＋</button>
     <button type="button" aria-label="ย่อร้านสามมิติ" onClick={()=>controller.current?.zoom(1/1.2)}>−</button>
     <button type="button" onClick={()=>controller.current?.reset()}>มุมเริ่มต้น</button>
   </div>
   <div className="room3d-stage" aria-label="โมเดลร้านสามมิติ เลือกโต๊ะจากป้ายหมายเลข">
     <Canvas orthographic shadows frameloop="demand" dpr={[1,1.5]} camera={{position:[8,12,13],near:.1,far:100}} fallback={fallback}
       gl={{antialias:true,alpha:true,powerPreference:'low-power'}} onCreated={({gl})=>{gl.domElement.addEventListener('webglcontextlost',()=>setFailed(true),{once:true})}}>
       <color attach="background" args={['#f9f2e6']} />
       <ambientLight intensity={1} /><hemisphereLight args={['#fff8ef','#bda78a',1.2]} />
       <directionalLight castShadow position={[-3,10,6]} intensity={2} shadow-mapSize={[1024,1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={.04} />
       <CameraControls controller={controller} /><Room />
       {roomTables.filter(t=>tablePositions[t.table_number]).map(t=><DiningTable key={t.id} table={t} state={tableStatus(t,free,guests)} busy={busy||!available.has(t.id)} selected={selected===t.id} onSelect={onSelect} host={host} />)}
       <Label host={host} position={[-2.7,1.8,-3.7]} className="room3d-landmark">เคาน์เตอร์</Label>
       <Label host={host} position={[3.7,2.1,-4.4]} className="room3d-landmark">ห้องน้ำ</Label>
       <Label host={host} position={[0,.2,4.6]} className="room3d-landmark">↑ ทางเข้า</Label>
     </Canvas>
     <div className="room3d-overlay" ref={setHost} />
   </div>
   <p className="room3d-hint">ลากเพื่อหมุนร้าน · แตะป้ายโต๊ะเพื่อเลือก · ใช้ปุ่ม + / − เพื่อซูม</p>
 </div>;
}
