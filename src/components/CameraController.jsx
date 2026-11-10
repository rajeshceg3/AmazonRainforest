/* eslint-disable react-hooks/immutability -- Three.js camera and renderer are intentionally imperative objects. */
import { useLayoutEffect, useEffect, useRef, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'

export default function CameraController({subject,reset}){
 const controls=useRef(),{camera,gl,invalidate,size}=useThree();
 const canonical=useCallback(()=>{const target=new THREE.Vector3(...subject.target),offset=new THREE.Vector3(...subject.camera).sub(target),factor=Math.max(1,.65/(size.width/size.height));camera.position.copy(offset.multiplyScalar(factor).add(target))},[subject,camera,size.width,size.height]);
 useLayoutEffect(()=>{
  const c=controls.current;if(!c)return;
  c.enabled=false;c.enableDamping=false;c.reset();
  canonical();c.target.set(...subject.target);camera.lookAt(c.target);c.update();c.saveState();c.enabled=true;invalidate();
 },[camera,subject,reset,invalidate,canonical]);
 useEffect(()=>{const el=gl.domElement;el.tabIndex=0;const key=e=>{const c=controls.current;if(!c)return;const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(c.target));if(e.key==='Home'){canonical();c.target.set(...subject.target)}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)){if(e.key==='ArrowLeft')spherical.theta-=.15;if(e.key==='ArrowRight')spherical.theta+=.15;if(e.key==='ArrowUp')spherical.phi-=.1;if(e.key==='ArrowDown')spherical.phi+=.1;if(e.key==='+'||e.key==='=')spherical.radius*=.9;if(e.key==='-')spherical.radius*=1.1;spherical.phi=Math.max(.1,Math.min(Math.PI*.75,spherical.phi));spherical.radius=Math.max(subject.min,Math.min(subject.max,spherical.radius));camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(c.target))}else return;e.preventDefault();c.update();invalidate()};el.addEventListener('keydown',key);return()=>el.removeEventListener('keydown',key)},[camera,gl,invalidate,subject,canonical]);
 useFrame(()=>{if(controls.current){const c=controls.current;gl.domElement.dataset.camera=JSON.stringify({position:camera.position.toArray(),target:c.target.toArray()});}});
 return <OrbitControls ref={controls} enablePan={false} enableDamping={false} minDistance={subject.min} maxDistance={subject.max} minPolarAngle={.1} maxPolarAngle={Math.PI*.75} rotateSpeed={.55} zoomSpeed={.7} onChange={invalidate} makeDefault/>
}
