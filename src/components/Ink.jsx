// Hand-inked marks for the Amazon chrome: a liana vine for the hint,
// and short-stroke icons for the toggles.
export function Vine(){
 return <svg className="ink-icon vine" viewBox="0 0 28 44" aria-hidden="true" focusable="false">
  <path d="M14 1 C 10 6, 18 10, 14 15 C 10 20, 18 24, 14 29 C 12 32, 12 35, 13 38" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"/>
  <path d="M13 38 C 9 36, 6 37, 4 41 C 8 43, 12 43, 14 40" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M15 24 C 19 22, 23 23, 25 19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  <path d="M16 11 C 19 9, 22 10, 24 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
 </svg>
}
export function IconSound({on}){
 return <svg className="ink-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M4 9.5 C 4 9 4.4 8.7, 5 8.7 L 8 8.8 L 12.6 4.9 C 13 4.6, 13.5 4.8, 13.5 5.4 L 13.4 18.6 C 13.4 19.2, 12.9 19.5, 12.5 19.1 L 8 15.3 L 5 15.4 C 4.4 15.4, 4 15, 4 14.5 Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
  {on?<><path d="M16.5 9 C 17.8 10.2, 17.9 13.9, 16.6 15.1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d="M19 6.6 C 21.4 9, 21.5 15.2, 19.1 17.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></>
     :<path d="M16.5 9.4 L 21 14.6 M 21 9.4 L 16.5 14.6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>}
 </svg>
}
export function IconMotion({paused}){
 return <svg className="ink-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  {paused?<path d="M8 5.4 C 8 4.8, 8.6 4.5, 9 4.9 L 18.5 11.4 C 18.9 11.8, 18.9 12.4, 18.4 12.7 L 9.1 19.2 C 8.6 19.5, 8 19.2, 8 18.6 Z" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round"/>
        :<path d="M9 5.6 L 8.9 18.4 M 15.1 5.5 L 15 18.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>}
 </svg>
}
export function IconTheme({dark}){
 return <svg className="ink-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  {dark?<path d="M15.6 4.2 C 11.4 4.9, 8.3 8.3, 8.4 12.3 C 8.5 16, 11.2 18.9, 14.8 19.5 C 13.1 20.4, 11.1 20.7, 9.2 20.2 C 5.6 19.3, 3.2 16.1, 3.4 12.4 C 3.6 8.5, 6.7 5.3, 10.6 4.6 C 12.3 4.3, 14 4.1, 15.6 4.2 Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
      :<><circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="2.2"/><path d="M12 2.8 L 12 5.2 M 12 18.8 L 12 21.2 M 2.8 12 L 5.2 12 M 18.8 12 L 21.2 12 M 5.5 5.5 L 7.2 7.2 M 16.8 16.8 L 18.5 18.5 M 18.5 5.5 L 16.8 7.2 M 7.2 16.8 L 5.5 18.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></>}
 </svg>
}
export function IconPin({pinned}){
 return <svg className="ink-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M14.5 3.6 L 20.4 9.5 C 20.8 9.9, 20.6 10.6, 20 10.7 L 16.4 11.1 L 13.2 19.6 C 13 20.1, 12.3 20.2, 12 19.8 L 9.7 16.4 L 4.9 21.2 M 3.6 14.5 C 3.4 14, 3.7 13.5, 4.2 13.4 L 12.9 11.2 L 13.3 4 C 13.4 3.4, 14.1 3.2, 14.5 3.6 Z" fill={pinned?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
 </svg>
}

const GLYPHS = {
 river: <><path d="M3 8 C 7 6, 11 10, 15 8 C 17 7, 19 7.2, 21 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d="M3 13 C 7 11, 11 15, 15 13 C 17 12, 19 12.2, 21 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d="M5 18 C 8 16.5, 12 19.5, 16 17.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
 jaguar: <><ellipse cx="12" cy="14.5" rx="4" ry="3.4" fill="none" stroke="currentColor" strokeWidth="2.2"/><circle cx="6.5" cy="8.5" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="10.2" cy="6.8" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="14" cy="6.9" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.4" cy="8.7" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.8"/></>,
 dolphin: <><path d="M3.5 15.5 C 7 8.5, 14 6.5, 20.5 10.5" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/><path d="M11.5 9.2 C 12 7.2, 13.2 6, 15 5.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 11 C 20.5 11.4, 21.4 12.4, 21.6 13.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
 sloth: <><path d="M3 6.5 C 9 5.5, 15 5.8, 21 6.3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d="M8 6.6 C 7.4 10.5, 8.4 13.5, 11 15.2 C 12.6 16.2, 14.8 16, 15.8 14.6 C 16.8 13.2, 16.4 11, 15 10.2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d="M15.8 6.4 C 16.2 8.2, 16 9.4, 15.2 10.3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
 macaw: <><path d="M7 20.5 C 7.5 13, 10.5 6.5, 17 3.5 C 17.6 3.2, 18.2 3.6, 18 4.2 C 15.8 10.8, 12.4 16.4, 7.6 20.9 Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/><path d="M8.2 19.2 C 10.8 14.2, 13.6 9.2, 16.6 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>,
 frog: <><path d="M5 15.5 C 5 11.8, 8.2 9.4, 12 9.5 C 15.8 9.6, 19 11.9, 18.9 15.5 C 18.8 18, 15.7 19.6, 12 19.5 C 8.3 19.4, 5.1 17.9, 5 15.5 Z" fill="none" stroke="currentColor" strokeWidth="2.2"/><circle cx="8.6" cy="9" r="2.4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="15.4" cy="9" r="2.4" fill="none" stroke="currentColor" strokeWidth="2"/></>,
 hummingbird: <><path d="M8 13.5 C 9.5 10.5, 13.5 9.8, 15.8 11.8 C 16.8 12.7, 17 14.2, 16.2 15.4 C 14.8 17.4, 11 17.2, 9.2 15.2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d="M15.9 12.2 L 21.5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11 C 9.4 8.6, 10 6.4, 11.8 5.2 C 12.8 7.4, 12.4 9.8, 10.8 11.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></>,
 butterfly: <><path d="M12 7.5 L 11.9 16.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d="M11.6 8.6 C 8.8 5.8, 4.9 6.2, 5 9.4 C 5.1 11.6, 8 12.4, 11.4 11.2 M 11.6 12.6 C 8.6 12.6, 5.8 14.4, 6.8 16.4 C 7.8 18.2, 10.8 16.8, 11.7 14.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12.4 8.6 C 15.2 5.8, 19.1 6.2, 19 9.4 C 18.9 11.6, 16 12.4, 12.6 11.2 M 12.4 12.6 C 15.4 12.6, 18.2 14.4, 17.2 16.4 C 16.2 18.2, 13.2 16.8, 12.3 14.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></>,
 lilies: <><path d="M4 14.5 C 4 10.9, 7.6 8, 12 8.1 C 16.4 8.2, 20 11, 19.9 14.5 C 19.8 18, 16.3 20.4, 12 20.3 C 7.7 20.2, 4.1 17.9, 4 14.5 Z" fill="none" stroke="currentColor" strokeWidth="2.2"/><path d="M12 8.2 L 18.5 13.2 L 12 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></>,
}
export function SubjectGlyph({id}){
 return <svg className="ink-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{GLYPHS[id]||null}</svg>
}
