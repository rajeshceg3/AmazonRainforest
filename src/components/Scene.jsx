/* eslint-disable react-hooks/immutability -- Three.js shadow-map invalidation is an imperative renderer API. */
import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MotionContext, useMotion } from './MotionContext'
import CameraController from './CameraController'
import AudioController from './Audio/AudioController'
import { JaguarStudy, DolphinStudy, SlothStudy, MacawStudy, FrogStudy, HummingbirdStudy, ButterflyStudy } from './AnimalStudies'

function RenderCadence({active,subject}){const {invalidate,gl}=useThree();useEffect(()=>{gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=true;invalidate()},[subject,gl,invalidate]);useEffect(()=>{if(!active)return;const t=setInterval(invalidate,80);return()=>clearInterval(t)},[active,invalidate]);return null}
function Water({river}){
 const mat=useRef(),motion=useMotion();useFrame(({clock})=>{if(mat.current&&motion)mat.current.uniforms.time.value=clock.elapsedTime});
 const uniforms=useMemo(()=>({time:{value:0}}),[]);
 return <mesh rotation={[-Math.PI/2,0,.18]} position={[river?0:-9,-.3,0]} receiveShadow><planeGeometry args={[river?17:8,120,1,1]}/><shaderMaterial ref={mat} uniforms={uniforms} vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`varying vec2 vUv;uniform float time;void main(){float w=sin(vUv.y*540.+sin(vUv.x*90.)*2.+time*.5)*.5+.5;float shine=pow(max(0.,sin(vUv.x*120.+vUv.y*290.-time*.3)),22.);vec3 c=mix(vec3(.075,.22,.19),vec3(.19,.39,.32),w*.4);c+=vec3(.24,.24,.14)*shine*.55;gl_FragColor=vec4(c,1.);}`}/></mesh>
}
function Tree({x,z,height=14,seed=0}){
 const y=-.5;
 return <group position={[x,y,z]}>
  <mesh castShadow position={[0,height/2,0]}><cylinderGeometry args={[.28,.65,height,9]}/><meshStandardMaterial color={seed%2?'#66543a':'#75644b'} roughness={.95}/></mesh>
  {[0,1,2,3].map(i=><mesh key={i} rotation={[0,i*Math.PI/2,0]} position={[Math.sin(i*Math.PI/2)*.45,.7,Math.cos(i*Math.PI/2)*.45]} scale={[.22,1.5,1.8]}><coneGeometry args={[1,1,3]}/><meshStandardMaterial color="#65513b"/></mesh>)}
  {[0,1,2,3,4].map(i=><mesh key={i} position={[Math.sin(i*2.4)*2,height+(i%2),Math.cos(i*2.4)*2]} scale={[3.8,1.5,3.2]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={['#326a49','#477f4e','#2c6246','#4d8054','#638c4e'][(i+seed)%5]} roughness={.9}/></mesh>)}
 </group>
}
function Habitat({subject}){
 const trees=useMemo(()=>Array.from({length:38},(_,i)=>{const angle=i*2.39996,r=12+(i%6)*3;return {x:Math.sin(angle)*r,z:Math.cos(angle)*r,height:11+(i%7)*1.3,seed:i}}),[]);
 const river=subject.id==='dolphin'||subject.id==='lilies';
 return <>
  <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.52,0]}><circleGeometry args={[70,64]}/><meshStandardMaterial color="#273f2c" roughness={1}/></mesh>
  <Water river={river}/>
  {Array.from({length:110},(_,i)=>{const a=i*2.39996,r=3+(i%20)*.65;return <mesh key={'l'+i} position={[Math.sin(a)*r,-.505,Math.cos(a)*r]} rotation={[-Math.PI/2,0,a]} scale={[.2+(i%3)*.08,.09,1]}><circleGeometry args={[1,6]}/><meshStandardMaterial color={['#4b5834','#786741','#8a7949','#31553a'][i%4]} side={THREE.DoubleSide}/></mesh>})}
  {Array.from({length:14},(_,i)=><mesh key={'vine'+i} position={[Math.sin(i*2.4)*13,6,Math.cos(i*2.4)*13]} rotation={[0,0,(i%3-1)*.08]}><cylinderGeometry args={[.045,.07,12,5]}/><meshStandardMaterial color="#344d2c"/></mesh>)}
  {trees.map((t,i)=><Tree key={i} {...t}/>)}
  {Array.from({length:28},(_,i)=>{const a=i*2.4,r=7+(i%5)*2;return <group key={i} position={[Math.sin(a)*r,-.45,Math.cos(a)*r]}>{[0,1,2,3,4].map(j=><mesh key={j} rotation={[.5,j*1.25,.55]} position={[0,.45,0]} scale={[.25,1.3,.09]}><sphereGeometry args={[1,6,6]}/><meshStandardMaterial color={i%2?'#61904c':'#3e7946'} roughness={.9}/></mesh>)}</group>})}
  {Array.from({length:12},(_,i)=><mesh key={i} position={[-8+(i%4)*1.5,-.24,-6+Math.floor(i/4)*3]} rotation={[-Math.PI/2,0,i]}><circleGeometry args={[.7+(i%3)*.2,20,.2,Math.PI*1.9]}/><meshStandardMaterial color="#70934f" side={THREE.DoubleSide} roughness={.6}/></mesh>)}
  {subject.id==='lilies'&&Array.from({length:7},(_,i)=><group key={i} position={[Math.sin(i*2.4)*2.8,-.18,Math.cos(i*2.4)*2.8]}><mesh rotation={[-Math.PI/2,0,i]}><circleGeometry args={[1.05,40,.15,Math.PI*1.94]}/><meshStandardMaterial color="#739a50" side={THREE.DoubleSide}/></mesh><mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.02,.07,5,40,Math.PI*1.94]}/><meshStandardMaterial color="#8dad5c"/></mesh><group position={[.25,.14,.2]}>{Array.from({length:12},(_,j)=><mesh key={j} position={[Math.sin(j*Math.PI/6)*.16,.07,Math.cos(j*Math.PI/6)*.16]} rotation={[Math.cos(j*Math.PI/6)*.5,j*Math.PI/6,-Math.sin(j*Math.PI/6)*.5]} scale={[.075,.1,.24]}><sphereGeometry args={[1,10,8]}/><meshStandardMaterial color={j%2?'#eadbcb':'#cdb6bc'}/></mesh>)}<mesh position={[0,.13,0]}><sphereGeometry args={[.1,12,8]}/><meshStandardMaterial color="#d1b352"/></mesh></group></group>)}
  {(subject.id==='sloth'||subject.id==='macaw')&&<mesh position={[0,subject.id==='sloth'?4.15:1.13,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.17,.24,8,10]}/><meshStandardMaterial color="#7c694c"/></mesh>}
 </>
}
export default function Scene({subject,reset,audioStarted,paused}){
 return <Canvas shadows dpr={1} frameloop="demand" camera={{position:subject.camera,fov:45,near:.1,far:180}} fallback={<p className="webgl-error">This browser could not start the 3D world. Try enabling hardware acceleration or opening another browser. The subject notes remain available below.</p>} gl={{antialias:true,alpha:false,powerPreference:'low-power'}} onCreated={({gl})=>{gl.domElement.setAttribute('aria-label','Interactive Amazon rainforest. Use the Explore menu, drag to orbit, or pinch to zoom.');gl.domElement.setAttribute('role','img');gl.setClearColor('#708b70')}}>
  <MotionContext.Provider value={!paused}><fog attach="fog" args={['#708b70',12,48]}/><ambientLight intensity={.35}/><hemisphereLight args={['#c5ddbf','#243829',1.25]}/><directionalLight castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-normalBias={.035} position={[-6,12,-8]} intensity={2.6} color="#ffe5ad"/><directionalLight position={[8,5,4]} intensity={.7} color="#91c5ac"/>
  <RenderCadence active={!paused||audioStarted} subject={subject}/><CameraController subject={subject} reset={reset} paused={paused}/><AudioController started={audioStarted}/>
  <Habitat subject={subject}/>
  {(subject.id==='river'||subject.id==='jaguar')&&<JaguarStudy/>}
  {subject.id==='dolphin'&&<DolphinStudy/>}
  {subject.id==='sloth'&&<SlothStudy/>}
  {subject.id==='macaw'&&<MacawStudy/>}
  {subject.id==='frog'&&<FrogStudy/>}{subject.id==='hummingbird'&&<HummingbirdStudy/>}{subject.id==='butterfly'&&<ButterflyStudy/>}
 </MotionContext.Provider></Canvas>
}
