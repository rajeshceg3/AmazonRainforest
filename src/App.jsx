import { useState, useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import Scene from './components/Scene'
import { subjects } from './subjects'
import { Vine, IconSound, IconMotion, IconTheme, IconPin, SubjectGlyph } from './components/Ink'

const PIN_KEY = 'amazon-chrome-pin'
const TOP_ZONE = 96
const BOTTOM_ZONE = 150
const RETIRE_MS = 2600

export default function App(){
 const [entered,setEntered]=useState(false),[subject,setSubject]=useState('river'),[reset,setReset]=useState(0),[sound,setSound]=useState(false),[paused,setPaused]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),[theme,setTheme]=useState('dark'),[audioError,setAudioError]=useState('');
 const selected=subjects.find(x=>x.id===subject);

 // Chrome: the forest leads; controls visit when called and retire when left.
 const [pinned,setPinned]=useState(()=>{try{return localStorage.getItem(PIN_KEY)==='1'}catch{return false}});
 const [chrome,setChrome]=useState(true); // greets on entry, then retires
 const focusWithin=useRef(false),retireTimer=useRef(null),rootRef=useRef(null);
 const retireSoon=useCallback(()=>{clearTimeout(retireTimer.current);retireTimer.current=setTimeout(()=>{if(!focusWithin.current)setChrome(false)},RETIRE_MS)},[]);
 const wake=useCallback(()=>{setChrome(true);retireSoon()},[retireSoon]);
 useEffect(()=>{
  retireSoon(); // entry greeting retires on its own
  const onPointerMove=(e)=>{if(e.pointerType==='touch')return;if(e.clientY<TOP_ZONE||e.clientY>window.innerHeight-BOTTOM_ZONE)wake()};
  const onKey=(e)=>{if(e.key==='Escape'){focusWithin.current=false;setChrome(false)}};
  document.addEventListener('pointermove',onPointerMove);document.addEventListener('keydown',onKey);
  return()=>{document.removeEventListener('pointermove',onPointerMove);document.removeEventListener('keydown',onKey);clearTimeout(retireTimer.current)};
 },[wake,retireSoon]);
 const togglePin=()=>{setPinned(p=>{const next=!p;try{next?localStorage.setItem(PIN_KEY,'1'):localStorage.removeItem(PIN_KEY)}catch{}if(next)setChrome(true);return next})};
 const onChromeFocus=(e)=>{if(e.target.closest&&e.target.closest('.world-toolbar, .subject-trail, .chrome-hint')){focusWithin.current=true;clearTimeout(retireTimer.current);setChrome(true)}};
 const onChromeBlur=(e)=>{if(!rootRef.current?.contains(e.relatedTarget)){focusWithin.current=false;retireSoon()}};
 const chromeOn=chrome||pinned;
 useEffect(()=>{if(entered)wake()},[entered,wake]);

 async function toggleSound(){if(sound){Tone.getDestination().mute=true;setSound(false);return;}try{await Tone.start();Tone.getDestination().mute=false;setSound(true);setAudioError('')}catch{setAudioError('Sound could not start. The world is still available without it.')}}
 return <main className="world" data-theme={theme} ref={rootRef} onFocusCapture={onChromeFocus} onBlurCapture={onChromeBlur}>
  {entered?<>
   <div className="scene-stage"><Scene subject={selected} reset={reset} audioStarted={sound} paused={paused}/></div>
   {!chromeOn&&<button className="chrome-hint" aria-label="Show controls" onClick={wake}><Vine/></button>}
   <header className={`world-toolbar chrome${chromeOn?' chrome-on':''}`} aria-label="World controls">

    <div className="icon-toggles">
     <button id="reset-view" className="ink-toggle" aria-label="Reset view" title="Reset view" onClick={()=>setReset(x=>x+1)}><svg className="ink-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19.2 12.2 C 19.1 16.2, 15.9 19.3, 11.9 19.2 C 8 19.1, 5 16, 5.1 12 C 5.2 8.1, 8.4 5, 12.3 5.1 C 14.7 5.2, 16.8 6.3, 18.1 8.1" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><path d="M18.4 4.4 C 18.5 6, 18.4 7.4, 18.2 8.9 C 16.6 8.5, 15.2 8.2, 13.7 8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
     <button id="sound-toggle" className="ink-toggle" aria-pressed={sound} aria-label={sound?'Turn sound off':'Turn sound on'} title={sound?'Sound on':'Sound off'} onClick={toggleSound}><IconSound on={sound}/></button>
     <button id="motion-toggle" className="ink-toggle" aria-pressed={paused} aria-label={paused?'Play motion':'Pause motion'} title={paused?'Play motion':'Pause motion'} onClick={()=>setPaused(x=>!x)}><IconMotion paused={paused}/></button>
     <button id="theme-toggle" className="ink-toggle" aria-label={theme==='dark'?'Light controls':'Dark controls'} title={theme==='dark'?'Light controls':'Dark controls'} onClick={()=>setTheme(x=>x==='dark'?'light':'dark')}><IconTheme dark={theme==='dark'}/></button>
     <button id="pin-controls" className="ink-toggle" aria-pressed={pinned} aria-label={pinned?'Let controls retire':'Keep controls visible'} title={pinned?'Let controls retire':'Keep controls visible'} onClick={togglePin}><IconPin pinned={pinned}/></button>
    </div>
   </header>
    <nav className={'subject-trail chrome'+(chromeOn?' chrome-on':'')} role="radiogroup" aria-label="Choose a subject">{subjects.map(s=><button key={s.id} type="button" data-subject={s.id} role="radio" aria-checked={subject===s.id} aria-label={s.name} title={s.name} tabIndex={subject===s.id?0:-1} className="trail-token" onClick={()=>{setSubject(s.id);setReset(x=>x+1)}} onKeyDown={e=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();const i=subjects.findIndex(x=>x.id===subject);const n=subjects[(i+(e.key==='ArrowRight'?1:subjects.length-1))%subjects.length];setSubject(n.id);setReset(x=>x+1)}}><SubjectGlyph id={s.id}/></button>)}</nav>

   <section className="subject-note" aria-live="polite"><h1>{selected.title}</h1><p>{selected.note}</p>{selected.source&&<a href={selected.source} target="_blank" rel="noopener noreferrer">Read the WWF species notes</a>}<p className="world-caption">Procedural illustration. Drag to orbit 360°. Pinch or scroll to zoom. <span className="keyboard-tip">Focus the scene and use arrow keys to turn; Home resets.</span></p>{audioError&&<p role="status">{audioError}</p>}</section>
  </>:<section className="start-panel"><div className="start-art" aria-hidden="true"><span/><span/><span/></div><div className="start-copy"><h1>Amazon rainforest</h1><p>A river clearing, a canopy and the animals that give this forest its character.</p><p>Nine views to explore in 360°. Sound is off until you choose it.</p><button id="enter-world" onClick={()=>setEntered(true)}>Explore the forest</button><p className="world-caption">An illustrated habitat, not a live camera or a mapped place.</p></div></section>}
 </main>
}
