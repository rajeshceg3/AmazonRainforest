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
