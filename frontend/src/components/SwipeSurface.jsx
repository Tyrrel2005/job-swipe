import { useRef, useState } from 'react';
/** Geste horizontal et navigation clavier : droite = intérêt, gauche = passer. */
export function SwipeSurface({children,onLeft,onRight,disabled=false}) {
  const start=useRef(null);
  const [delta,setDelta]=useState(0);
  function begin(e) { if(disabled || e.button !== 0) return;start.current={x:e.clientX,y:e.clientY}; }
  function move(e){if(!start.current || disabled)return;const dx=e.clientX-start.current.x;const dy=e.clientY-start.current.y;if(Math.abs(dy)>Math.abs(dx)*1.7)return;setDelta(Math.max(-220,Math.min(220,dx)));}
  function end(e){if(!start.current)return;const dx=e.clientX-start.current.x;start.current=null;setDelta(0);if(disabled || Math.abs(dx)<95)return;if(dx>0)onRight?.();else onLeft?.();}
  function key(e){if(e.target.closest('button,a,input,textarea,select'))return;if(e.key==='ArrowRight'){e.preventDefault();onRight?.()}if(e.key==='ArrowLeft'){e.preventDefault();onLeft?.()}}
  return <div role="group" tabIndex={0} aria-label="Glisser à gauche pour passer, à droite pour manifester un intérêt" onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{start.current=null;setDelta(0)}} onKeyDown={key} style={{touchAction:'pan-y',transform:`translateX(${delta}px) rotate(${delta/25}deg)`,transition:delta===0?'transform .2s ease':'none',position:'relative'}}>{delta>45&&<span className="swipe-stamp yes">INTÉRESSÉ</span>}{delta< -45&&<span className="swipe-stamp no">PASSER</span>}{children}</div>;
}
