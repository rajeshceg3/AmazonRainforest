import { useState } from 'react'
import * as Tone from 'tone'
import Scene from './components/Scene'
import { subjects } from './subjects'

export default function App(){
 const [entered,setEntered]=useState(false),[subject,setSubject]=useState('river'),[reset,setReset]=useState(0),[sound,setSound]=useState(false),[paused,setPaused]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),[theme,setTheme]=useState('dark'),[audioError,setAudioError]=useState('');
 const selected=subjects.find(x=>x.id===subject);
 async function toggleSound(){if(sound){Tone.getDestination().mute=true;setSound(false);return;}try{await Tone.start();Tone.getDestination().mute=false;setSound(true);setAudioError('')}catch{setAudioError('Sound could not start. The world is still available without it.')}}
 return <main className="world" data-theme={theme}>
  {entered?<>
   <div className="scene-stage"><Scene subject={selected} reset={reset} audioStarted={sound} paused={paused}/></div>
   <header className="world-toolbar" aria-label="World controls">
    <label htmlFor="subject">Explore</label><select id="subject" value={subject} onChange={e=>{setSubject(e.target.value);setReset(x=>x+1)}}>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
    <button id="reset-view" onClick={()=>setReset(x=>x+1)}>Reset view</button>
    <button id="sound-toggle" aria-pressed={sound} onClick={toggleSound}>Sound {sound?'on':'off'}</button>
    <button id="motion-toggle" aria-pressed={paused} onClick={()=>setPaused(x=>!x)}>{paused?'Play motion':'Pause motion'}</button>
    <button id="theme-toggle" onClick={()=>setTheme(x=>x==='dark'?'light':'dark')}>{theme==='dark'?'Light':'Dark'} controls</button>
   </header>
   <section className="subject-note" aria-live="polite"><h1>{selected.title}</h1><p>{selected.note}</p>{selected.source&&<a href={selected.source} target="_blank" rel="noopener noreferrer">Read the WWF species notes</a>}<p className="world-caption">Procedural illustration. Drag to orbit 360°. Pinch or scroll to zoom. <span className="keyboard-tip">Focus the scene and use arrow keys to turn; Home resets.</span></p>{audioError&&<p role="status">{audioError}</p>}</section>
  </>:<section className="start-panel"><div className="start-art" aria-hidden="true"><span/><span/><span/></div><div className="start-copy"><h1>Amazon rainforest</h1><p>A river clearing, a canopy and the animals that give this forest its character.</p><p>Nine views to explore in 360°. Sound is off until you choose it.</p><button id="enter-world" onClick={()=>setEntered(true)}>Explore the forest</button><p className="world-caption">An illustrated habitat, not a live camera or a mapped place.</p></div></section>}
 </main>
}
