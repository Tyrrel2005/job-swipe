import { useState } from 'react';
import { SKILL_GROUPS } from '../data/options';
import { Icon } from './UI';
export function SkillPicker({value = [], onChange, tone='blue'}) {
 const [group,setGroup]=useState('Toutes');
 const groups=group==='Toutes'?SKILL_GROUPS:SKILL_GROUPS.filter(g=>g.name===group);
 return <><div className="category-strip"><button type="button" className={`category ${group==='Toutes'?'active':''}`} onClick={()=>setGroup('Toutes')}>Toutes</button>{SKILL_GROUPS.map(g=><button type="button" key={g.name} className={`category ${group===g.name?'active':''}`} onClick={()=>setGroup(g.name)}>{g.name}</button>)}</div><div className="skill-groups">{groups.map(g=><div key={g.name}><h3 className="skill-header"><Icon name={g.icon} size={18}/>{g.name}<small>{g.items.length} choix</small></h3><div className="chips">{g.items.map(s=><button type="button" className={`chip ${value.includes(s)?`selected ${tone}`:''}`} aria-pressed={value.includes(s)} key={s} onClick={()=>onChange(value.includes(s)?value.filter(v=>v!==s):[...value,s])}>{s}</button>)}</div></div>)}</div></>;
}
