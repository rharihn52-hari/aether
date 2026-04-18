"use client";
import { useState, useRef, useEffect, useCallback } from "react";

function AetherLogo({size=32}:{size?:number}){
  return(<svg viewBox="0 0 80 80" width={size} height={size}>
    <circle cx="40" cy="40" r="8" fill="var(--ac)"/><circle cx="20" cy="22" r="3" fill="var(--acd)"/><circle cx="60" cy="22" r="3" fill="var(--acd)"/><circle cx="18" cy="55" r="3" fill="var(--t2)"/><circle cx="62" cy="55" r="3" fill="var(--t2)"/><circle cx="40" cy="14" r="3" fill="var(--acd)"/>
    <line x1="40" y1="32" x2="40" y2="17" stroke="var(--acd)" strokeWidth="0.8"/><line x1="33" y1="35" x2="22" y2="24" stroke="var(--acd)" strokeWidth="0.8"/><line x1="47" y1="35" x2="58" y2="24" stroke="var(--acd)" strokeWidth="0.8"/><line x1="33" y1="46" x2="20" y2="53" stroke="var(--t2)" strokeWidth="0.8"/><line x1="47" y1="46" x2="60" y2="53" stroke="var(--t2)" strokeWidth="0.8"/>
    <text x="40" y="44" textAnchor="middle" fontFamily="Sora,sans-serif" fontSize="9" fontWeight="700" fill="var(--bg0)">Ae</text>
  </svg>);
}
function MicIcon(){return<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
function SineWave(){return<svg viewBox="0 0 120 24" className="w-full h-6"><path d="M0,12 Q15,2 30,12 Q45,22 60,12 Q75,2 90,12 Q105,22 120,12" fill="none" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round" opacity="0.4"><animate attributeName="d" dur="2s" repeatCount="indefinite" values="M0,12 Q15,2 30,12 Q45,22 60,12 Q75,2 90,12 Q105,22 120,12;M0,12 Q15,22 30,12 Q45,2 60,12 Q75,22 90,12 Q105,2 120,12;M0,12 Q15,2 30,12 Q45,22 60,12 Q75,2 90,12 Q105,22 120,12"/></path></svg>}
function EqBars(){return<div className="flex gap-[3px] items-center h-6 flex-1 justify-center">{[0,0.08,0.16,0.24,0.12,0.2,0.06,0.14,0.22,0.1,0.18,0.04,0.15,0.09,0.21].map((d,i)=><div key={i} className="rounded-full" style={{width:3,background:"var(--bg0)",opacity:0.7,animation:`eqBar 0.7s ease-in-out ${d}s infinite`}}/>)}</div>}

const ME={name:"Hari Rajanala",role:"Software Architect",bio:"Software Architect with 7+ years in C#/.NET Core, React, Angular, TypeScript, and cloud platforms. Creator of Aether.",avatar:"",location:"Hyderabad, India",skills:["C#/.NET Core","React","TypeScript","Angular","SQL Server","Azure","Next.js","AI/ML","Healthcare Tech"],links:[{label:"GitHub",url:"https://github.com/rharihn52-hari"},{label:"LinkedIn",url:"https://linkedin.com/in/EDIT-HERE"},{label:"Email",url:"mailto:EDIT@EMAIL.COM"}]};

const THEMES=[
  {id:"glass-nebula",name:"Glass Nebula",color:"#8050dc"},
  {id:"obsidian-forge",name:"Obsidian Forge",color:"#e8a84c"},
  {id:"arctic-aurora",name:"Arctic Aurora",color:"#2dd4a8"},
  {id:"neon-tokyo",name:"Neon Tokyo",color:"#f43f7a"},
  {id:"deep-sapphire",name:"Deep Sapphire",color:"#4a8ff7"},
  {id:"sakura-noir",name:"Sakura Noir",color:"#e8879a"},
  {id:"ember-ash",name:"Ember & Ash",color:"#e85535"},
  {id:"phantom-violet",name:"Phantom Violet",color:"#a78bfa"},
  {id:"mint-matrix",name:"Mint Matrix",color:"#4ade80"},
  {id:"copper-circuit",name:"Copper Circuit",color:"#d4915c"},
  {id:"frost-ice",name:"Frost & Ice",color:"#7ec8e8"},
];
const CHAT_STYLES=[{id:"gradient",name:"Gradient edge"},{id:"slack",name:"Slack"},{id:"gpt",name:"ChatGPT"},{id:"naked",name:"Naked"},{id:"terminal",name:"Terminal"},{id:"imsg",name:"iMessage"}];
const MODES=[{id:"swift",icon:"⚡",label:"Swift",desc:"Fast, concise"},{id:"think",icon:"◈",label:"Think",desc:"Step-by-step"},{id:"beast",icon:"✦",label:"Beast",desc:"Maximum depth"},{id:"search",icon:"◎",label:"Search",desc:"Real-time"}];
const IMG_MODELS=[{id:"turbo",label:"Turbo"},{id:"flux",label:"Flux"},{id:"flux-realism",label:"Realism"},{id:"flux-anime",label:"Anime"},{id:"flux-3d",label:"3D"}];
const STARTERS=["Explain quantum computing simply","Write a Python REST API","Compare React vs Angular","Help me write a cover letter"];
const CODE_STARTERS=["Build a REST API with Express","React hook for infinite scroll","Debug: useEffect runs twice","Convert SQL to LINQ C#"];

type Tab="chat"|"code"|"image";
interface Msg{role:"user"|"assistant";content:string;ts:number}
interface Img{url:string;prompt:string;model:string;ts:number}

function CodeBlock({code,lang}:{code:string;lang:string}){
  const[cp,setCp]=useState(false);
  return(<div className="my-2 rounded-xl overflow-hidden" style={{border:"1px solid var(--brd)"}}><div className="flex items-center justify-between px-3 py-1.5" style={{background:"var(--bg3)"}}><span className="font-mono text-[10px]" style={{color:"var(--ac)"}}>{lang||"code"}</span><button onClick={()=>{navigator.clipboard.writeText(code);setCp(true);setTimeout(()=>setCp(false),2000)}} className="font-mono text-[10px] px-2 py-0.5 rounded" style={{color:cp?"var(--ac)":"var(--t2)",background:"var(--bg2)"}}>{cp?"Copied!":"Copy"}</button></div><pre className="p-3 overflow-x-auto" style={{background:"var(--bg0)",margin:0}}><code className="font-mono text-xs" style={{color:"var(--t1)"}}>{code}</code></pre></div>);
}
function Md({text}:{text:string}){
  const lines=text.split("\n"),out:JSX.Element[]=[];let inC=false,cb:string[]=[],cL="";
  lines.forEach((l,i)=>{if(l.startsWith("```")){if(inC){out.push(<CodeBlock key={i} code={cb.join("\n")} lang={cL}/>);cb=[];inC=false}else{cL=l.slice(3).trim();inC=true}return}if(inC){cb.push(l);return}if(l.startsWith("### "))out.push(<h3 key={i} className="text-sm font-semibold mt-2 mb-0.5" style={{color:"var(--t0)"}}>{l.slice(4)}</h3>);else if(l.startsWith("## "))out.push(<h2 key={i} className="text-[15px] font-semibold mt-2 mb-0.5" style={{color:"var(--t0)"}}>{l.slice(3)}</h2>);else if(l.startsWith("# "))out.push(<h1 key={i} className="text-base font-bold mt-2 mb-1" style={{color:"var(--t0)"}}>{l.slice(2)}</h1>);else if(l.startsWith("- ")||l.startsWith("* "))out.push(<li key={i} className="ml-4 list-disc text-sm leading-relaxed" style={{color:"var(--t1)"}}>{inl(l.slice(2))}</li>);else if(/^\d+\.\s/.test(l))out.push(<li key={i} className="ml-4 list-decimal text-sm leading-relaxed" style={{color:"var(--t1)"}}>{inl(l.replace(/^\d+\.\s/,""))}</li>);else if(l.startsWith("> "))out.push(<blockquote key={i} className="text-sm italic my-1 pl-3" style={{borderLeft:"2px solid var(--acd)",color:"var(--t2)"}}>{l.slice(2)}</blockquote>);else if(l.trim()==="")out.push(<div key={i} className="h-1"/>);else out.push(<p key={i} className="text-sm leading-relaxed" style={{color:"var(--t1)"}}>{inl(l)}</p>)});
  if(inC&&cb.length)out.push(<CodeBlock key="last" code={cb.join("\n")} lang={cL}/>);return<div>{out}</div>;
}
function inl(t:string):React.ReactNode{return t.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p,i)=>{if(p.startsWith("**")&&p.endsWith("**"))return<strong key={i} style={{color:"var(--t0)"}}>{p.slice(2,-2)}</strong>;if(p.startsWith("*")&&p.endsWith("*"))return<em key={i}>{p.slice(1,-1)}</em>;if(p.startsWith("`")&&p.endsWith("`"))return<code key={i} className="font-mono text-[0.82em] px-1 py-0.5 rounded" style={{background:"rgba(255,255,255,0.04)",color:"var(--ac)"}}>{p.slice(1,-1)}</code>;return p})}

function PulseDots(){return<div className="flex gap-1.5">{[0,1,2].map(i=><div key={i} className="pdot" style={{animationDelay:`${i*0.2}s`}}/>)}</div>}
function DnaHelix(){return<div className="flex gap-1.5 items-center h-6">{[0,1,2,3,4].map(i=><div key={i} className="flex flex-col items-center gap-1"><div className="dna-t" style={{animationDelay:`${i*0.15}s`}}/><div className="dna-b" style={{animationDelay:`${i*0.15}s`}}/></div>)}</div>}

function ChatMessage({m,style,onLongPress}:{m:Msg;style:string;onLongPress:(m:Msg,e:React.TouchEvent|React.MouseEvent)=>void}){
  const isU=m.role==="user";const time=new Date(m.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  const av=<AetherLogo size={18}/>;const timerRef=useRef<NodeJS.Timeout|null>(null);
  const handleDown=(e:React.TouchEvent|React.MouseEvent)=>{if(isU)return;timerRef.current=setTimeout(()=>onLongPress(m,e),500)};
  const handleUp=()=>{if(timerRef.current)clearTimeout(timerRef.current)};
  const wrap=(ch:React.ReactNode)=><div onTouchStart={handleDown} onTouchEnd={handleUp} onMouseDown={handleDown} onMouseUp={handleUp} onMouseLeave={handleUp}>{ch}</div>;

  if(style==="gradient")return wrap(<div>{isU?<div className="text-right py-1"><span className="text-sm" style={{color:"var(--t1)"}}>{m.content}</span></div>:<div className="py-2 px-3 rounded-lg" style={{background:"linear-gradient(90deg,var(--acg) 0%,transparent 4%)"}}><div className="flex items-center gap-1.5 mb-1">{av}<span className="font-display text-[10px] font-medium" style={{color:"var(--t1)"}}>Aether</span><span className="text-[8px]" style={{color:"var(--t2)"}}>{time}</span></div><Md text={m.content}/></div>}</div>);
  if(style==="slack")return wrap(<div className="flex gap-2 py-1">{isU?<div className="h-5 w-5 rounded-md flex items-center justify-center text-[8px] font-bold shrink-0" style={{background:"var(--bg3)",color:"var(--t2)"}}>{ME.name[0]}</div>:av}<div><div className="flex items-center gap-1.5"><span className="text-[10px] font-semibold" style={{color:isU?"var(--t2)":"var(--ac)"}}>{isU?"You":"Aether"}</span><span className="text-[8px]" style={{color:"var(--t2)"}}>{time}</span></div>{isU?<p className="text-sm" style={{color:"var(--t1)"}}>{m.content}</p>:<Md text={m.content}/>}</div></div>);
  if(style==="gpt")return wrap(<div className="py-2 px-3 rounded-lg" style={isU?{}:{background:"var(--acg)"}}>{!isU&&<div className="flex items-center gap-1.5 mb-1">{av}<span className="text-[10px] font-semibold" style={{color:"var(--ac)"}}>Aether</span></div>}{isU?<p className="text-sm" style={{color:"var(--t1)"}}>{m.content}</p>:<Md text={m.content}/>}</div>);
  if(style==="naked")return wrap(<div>{isU?<div className="text-right py-1"><span className="text-sm" style={{color:"var(--t2)"}}>{m.content}</span></div>:<div className="py-1 pl-3" style={{borderLeft:"2px solid var(--ac)"}}><Md text={m.content}/></div>}</div>);
  if(style==="terminal")return wrap(<div className="font-mono text-xs py-0.5">{isU?<div><span style={{color:"var(--ac)"}}>you &gt;</span> <span style={{color:"var(--t2)"}}>{m.content}</span></div>:<div><span style={{color:"var(--ac)"}}>aether &gt;</span> <Md text={m.content}/></div>}</div>);
  return wrap(<div className={`max-w-[85%] ${isU?"ml-auto":""}`}><div className="px-3 py-2 text-sm" style={isU?{background:"var(--acg)",borderRadius:"14px 14px 4px 14px",color:"var(--t0)"}:{background:"var(--bg2)",borderRadius:"14px 14px 14px 4px"}}>{isU?m.content:<Md text={m.content}/>}</div></div>);
}

export default function Home(){
  const[splash,setSplash]=useState(true);
  const[theme,setTheme]=useState(THEMES[0]);
  const[chatStyle,setChatStyle]=useState(CHAT_STYLES[0]);
  const[tab,setTab]=useState<Tab>("chat");
  const[profOpen,setProfOpen]=useState(false);
  const[sheetOpen,setSheetOpen]=useState(false);
  const[modePopup,setModePopup]=useState<typeof MODES[0]|null>(null);
  const[ctxMenu,setCtxMenu]=useState<{msg:Msg;y:number}|null>(null);
  const[scrolled,setScrolled]=useState(false);

  const[chatMsgs,setChatMsgs]=useState<Msg[]>([]);
  const[codeMsgs,setCodeMsgs]=useState<Msg[]>([]);
  const[input,setInput]=useState("");
  const[mode,setMode]=useState(MODES[1]);
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState("");

  const[imgP,setImgP]=useState("");
  const[imgM,setImgM]=useState(IMG_MODELS[0]);
  const[imgBusy,setImgBusy]=useState(false);
  const[imgSec,setImgSec]=useState(0);
  const[imgs,setImgs]=useState<Img[]>([]);
  const[imgErr,setImgErr]=useState("");
  const[lb,setLb]=useState<Img|null>(null);

  const[isListening,setIsListening]=useState(false);
  const[interimText,setInterimText]=useState("");
  const recognitionRef=useRef<any>(null);const listeningRef=useRef(false);
  const chatEnd=useRef<HTMLDivElement>(null);const inpRef=useRef<HTMLTextAreaElement>(null);const imgRef=useRef<HTMLTextAreaElement>(null);const scrollRef=useRef<HTMLDivElement>(null);const tmr=useRef<NodeJS.Timeout|null>(null);

  useEffect(()=>{setTimeout(()=>setSplash(false),2200)},[]);
  useEffect(()=>{document.documentElement.setAttribute("data-theme",theme.id)},[theme]);
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"})},[chatMsgs,codeMsgs,busy]);
  useEffect(()=>{if(!isListening&&inpRef.current){inpRef.current.style.height="auto";inpRef.current.style.height=Math.min(inpRef.current.scrollHeight,150)+"px"}},[input,isListening]);
  useEffect(()=>{if(imgBusy){setImgSec(0);tmr.current=setInterval(()=>setImgSec(s=>s+1),1000)}else if(tmr.current)clearInterval(tmr.current);return()=>{if(tmr.current)clearInterval(tmr.current)}},[imgBusy]);
  useEffect(()=>()=>{if(recognitionRef.current)try{recognitionRef.current.stop()}catch{}},[]);

  // Collapsing header on scroll
  const handleScroll=useCallback((e:React.UIEvent<HTMLDivElement>)=>{setScrolled((e.target as HTMLDivElement).scrollTop>40)},[]);

  // Voice
  const startVoice=(lang?:string)=>{if(typeof window==="undefined")return;const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR){alert("Use Chrome or Edge for voice.");return}const r=new SR();r.continuous=true;r.interimResults=true;r.maxAlternatives=1;r.lang=lang||"en-IN";let acc="";r.onstart=()=>{setIsListening(true);listeningRef.current=true;setInterimText("")};r.onresult=(e:any)=>{let fc="",interim="";for(let i=0;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)fc+=t+" ";else interim+=t}if(fc.trim()){acc+=fc;setInput(acc.trim())}setInterimText(interim)};r.onerror=(e:any)=>{if(e.error==="no-speech"||e.error==="aborted")return;listeningRef.current=false;setIsListening(false)};r.onend=()=>{if(listeningRef.current)try{r.start()}catch{listeningRef.current=false;setIsListening(false)}};recognitionRef.current=r;try{r.start()}catch{}};
  const stopVoice=()=>{listeningRef.current=false;setIsListening(false);setInterimText("");if(recognitionRef.current){try{recognitionRef.current.stop()}catch{}}recognitionRef.current=null};

  const msgs=tab==="code"?codeMsgs:chatMsgs;const setMsgs=tab==="code"?setCodeMsgs:setChatMsgs;

  const sendMsg=async(text?:string,forceMode?:string)=>{const c=(text||input).trim();if(!c||busy)return;if(isListening)stopVoice();const um:Msg={role:"user",content:c,ts:Date.now()};const cur=tab==="code"?codeMsgs:chatMsgs;const set=tab==="code"?setCodeMsgs:setChatMsgs;set(p=>[...p,um]);setInput("");setBusy(true);setErr("");try{const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[...cur,um].map(m=>({role:m.role,content:m.content})),mode:forceMode||(tab==="code"?"code":mode.id)})});const d=await r.json();if(!r.ok)throw new Error(d.error);set(p=>[...p,{role:"assistant",content:d.content,ts:Date.now()}])}catch(e:any){setErr(e?.message||"Failed")}finally{setBusy(false)}};

  const trySetMode=(m:typeof MODES[0])=>{if(m.id===mode.id)return;if(chatMsgs.length>0){setModePopup(m);return}setMode(m)};
  const confirmModeSwitch=()=>{if(modePopup){setChatMsgs([]);setMode(modePopup);setModePopup(null)}};

  const genImg=async()=>{if(!imgP.trim()||imgBusy)return;setImgBusy(true);setImgErr("");try{const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:imgP.trim(),model:imgM.id})});const d=await r.json();if(!r.ok)throw new Error(d.error);setImgs(p=>[{url:d.url,prompt:imgP.trim(),model:imgM.label,ts:Date.now()},...p])}catch(e:any){setImgErr(e?.message||"Failed")}finally{setImgBusy(false)}};

  const expPDF=async()=>{const j=(await import("jspdf")).default;const d=new j();d.setFont("helvetica","bold");d.setFontSize(16);d.text("Aether Export",20,20);d.setFont("helvetica","normal");d.setFontSize(9);d.text(new Date().toLocaleString(),20,27);let y=36;msgs.forEach(m=>{d.setFont("helvetica","bold");d.setFontSize(9);d.setTextColor(100,130,200);d.text(m.role==="user"?"You:":"Aether:",20,y);y+=5;d.setFont("helvetica","normal");d.setTextColor(50,50,50);d.splitTextToSize(m.content,170).forEach((l:string)=>{if(y>280){d.addPage();y=20}d.text(l,20,y);y+=4.5});y+=3});d.save(`aether-${Date.now()}.pdf`)};
  const expXL=async()=>{const X=await import("xlsx");const ws=X.utils.json_to_sheet(msgs.map(m=>({Role:m.role==="user"?"You":"Aether",Message:m.content,Time:new Date(m.ts).toLocaleString()})));ws["!cols"]=[{wch:10},{wch:80},{wch:18}];const wb=X.utils.book_new();X.utils.book_append_sheet(wb,ws,"Chat");X.writeFile(wb,`aether-${Date.now()}.xlsx`)};
  const dlImg=(img:Img)=>{const a=document.createElement("a");a.href=img.url;a.download=`aether-${img.ts}.png`;document.body.appendChild(a);a.click();document.body.removeChild(a)};
  const handleLongPress=(m:Msg,e:React.TouchEvent|React.MouseEvent)=>{const rect=(e.target as HTMLElement).getBoundingClientRect();setCtxMenu({msg:m,y:rect.top})};

  const Loader=mode.id==="beast"||tab==="code"?DnaHelix:PulseDots;
  const errBox=(e:string)=><div className="flex items-center gap-2 py-2 px-3 rounded-lg my-1" style={{background:"rgba(232,85,53,0.06)",border:"1px solid rgba(232,85,53,0.12)"}}><span className="text-xs" style={{color:"#e85535"}}>{e.includes("502")||e.includes("demand")?"Aether is warming up — try again in a moment":e.includes("504")||e.includes("long")?"Taking longer than expected — try Swift mode":e}</span></div>;

  // SPLASH with particles
  if(splash)return(
    <div className="splash fixed inset-0 z-50 flex flex-col items-center justify-center" style={{background:"var(--bg0)"}}>
      {[...Array(8)].map((_,i)=><div key={i} className="absolute rounded-full" style={{width:4,height:4,background:"var(--ac)",opacity:0,left:`${30+Math.random()*40}%`,top:`${30+Math.random()*40}%`,animation:`particleFloat ${2+Math.random()*2}s ease-in-out ${i*0.2}s infinite`,"--dx":`${(Math.random()-0.5)*60}px`,"--dy":`${(Math.random()-0.5)*60}px`} as React.CSSProperties}/>)}
      <div className="relative splash-logo"><AetherLogo size={64}/><div className="splash-ring absolute inset-0 rounded-2xl border-2 opacity-0" style={{borderColor:"var(--ac)"}}/></div>
      <h1 className="font-display text-2xl font-semibold mt-5 tracking-tight" style={{color:"var(--t0)"}}>Aether</h1>
      <p className="font-body text-xs mt-1" style={{color:"var(--t2)"}}>Beyond ordinary intelligence</p>
      <div className="mt-6"><PulseDots/></div>
    </div>
  );

  const chatArea=(isCode:boolean)=>{
    const curMsgs=isCode?codeMsgs:chatMsgs;const setCur=isCode?setCodeMsgs:setChatMsgs;
    return(
      <div className="pgIn flex flex-col h-full">
        {!isCode&&<div className="flex items-center justify-between mb-2 px-1">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">{MODES.map(m=><button key={m.id} onClick={()=>trySetMode(m)} className={`mpill shrink-0 ${mode.id===m.id?"on":""}`}><span className="mr-1">{m.icon}</span><span className="hidden sm:inline">{m.label}</span></button>)}</div>
          {curMsgs.length>0&&<div className="flex gap-1 shrink-0"><button onClick={expPDF} className="mpill text-[10px]">PDF</button><button onClick={expXL} className="mpill text-[10px]">XLS</button><button onClick={()=>{if(confirm("Clear?"))setCur([])}} className="mpill text-[10px]">✕</button></div>}
        </div>}
        {isCode&&<div className="flex items-center justify-between mb-2 px-1"><p className="font-body text-[11px]" style={{color:"var(--t2)"}}>⌘ Code generation & debugging</p>{curMsgs.length>0&&<div className="flex gap-1"><button onClick={expPDF} className="mpill text-[10px]">PDF</button><button onClick={()=>{if(confirm("Clear?"))setCur([])}} className="mpill text-[10px]">✕</button></div>}</div>}

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-1 pb-3" onScroll={handleScroll}>
          {curMsgs.length===0&&!busy&&(
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-4">{isCode?<div className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl" style={{background:"var(--acg)",color:"var(--ac)"}}>⌘</div>:<AetherLogo size={48}/>}</div>
              <h2 className="font-display text-lg font-semibold mb-1" style={{color:"var(--t1)"}}>{isCode?"Code anything":"What can I help with?"}</h2>
              <p className="font-body text-xs text-center max-w-sm mb-5" style={{color:"var(--t2)"}}>{isCode?"Write, debug, refactor. Production-grade.":"Ask anything. English or Telugu. Speak or type."}</p>
              <div className="grid grid-cols-2 gap-2 max-w-md w-full px-4">{(isCode?CODE_STARTERS:STARTERS).map(s=><button key={s} onClick={()=>sendMsg(s,isCode?"code":undefined)} className="glass px-3 py-2.5 text-left text-xs hover:border-[var(--brdh)]" style={{color:"var(--t2)"}}>{s}</button>)}</div>
            </div>
          )}
          {curMsgs.map((m,i)=><ChatMessage key={i} m={m} style={chatStyle.id} onLongPress={handleLongPress}/>)}
          {busy&&(
            <div className="flex flex-col items-start gap-1 py-2 px-1">
              <div className="flex items-center gap-2"><Loader/><span className="font-mono text-[10px] animate-pulse" style={{color:"var(--t2)"}}>{isCode?"Generating...":mode.id==="beast"?"Deep processing...":"Thinking..."}</span></div>
              <div className="w-32"><SineWave/></div>
            </div>
          )}
          {err&&errBox(err)}
          <div ref={chatEnd}/>
        </div>

        {/* Input — full bar takeover when listening */}
        {isListening?(
          <div className="glass p-2 mb-1" style={{paddingBottom:"calc(0.5rem + env(safe-area-inset-bottom))"}}>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{background:"var(--ac)"}}>
              <EqBars/>
              {interimText&&<span className="font-body text-xs truncate max-w-[180px]" style={{color:"var(--bg0)",opacity:0.8}}>{interimText}</span>}
              <button onClick={stopVoice} className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{background:"var(--bg0)"}}><div className="h-3 w-3 rounded-sm" style={{background:"var(--ac)"}}/></button>
            </div>
          </div>
        ):(
          <div className="glass p-2 flex items-end gap-2 mb-1" style={{paddingBottom:"calc(0.5rem + env(safe-area-inset-bottom))"}}>
            <textarea ref={inpRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg(undefined,isCode?"code":undefined)}}} placeholder={isCode?"Describe what to build...":"Ask anything..."} rows={1} className={`flex-1 resize-none rounded-xl px-3.5 py-2.5 ${isCode?"font-mono":"font-body"} text-sm`} style={{border:"1px solid var(--brd)",background:"var(--bg0)",color:"var(--t0)"}}/>
            <button onClick={()=>startVoice()} className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{border:"1px solid var(--brd)",background:"var(--bg2)",color:"var(--t2)"}} title="English"><MicIcon/></button>
            <button onClick={()=>startVoice("te-IN")} className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{border:"1px solid var(--brd)",background:"var(--bg2)",color:"var(--t2)"}} title="Telugu"><span className="text-[10px] font-bold">తె</span></button>
            <button onClick={()=>sendMsg(undefined,isCode?"code":undefined)} disabled={!input.trim()||busy} className="btn px-4 py-2.5 text-sm">{busy?"...":isCode?"Run":"Send"}</button>
          </div>
        )}
      </div>
    );
  };

  return(
    <div className="relative z-10 min-h-screen flex flex-col" style={{paddingBottom:"env(safe-area-inset-bottom)"}}>
      {/* Ambient mesh background */}
      <div className="ambient"/>

      {/* Long-press context menu */}
      {ctxMenu&&(<><div className="fixed inset-0 z-50" onClick={()=>setCtxMenu(null)}/><div className="ctx-menu fixed z-50 flex gap-1" style={{top:ctxMenu.y-40,left:16,right:16}}>{["Copy","Regenerate"].map(a=><button key={a} onClick={()=>{if(a==="Copy")navigator.clipboard.writeText(ctxMenu.msg.content);if(a==="Regenerate"){const last=msgs.filter(m=>m.role==="user").pop();if(last)sendMsg(last.content)}setCtxMenu(null)}} className="glass px-3 py-2 text-xs" style={{color:"var(--t1)"}}>{a}</button>)}</div></>)}

      {/* Mode popup — full takeover */}
      {modePopup&&(<div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)"}} onClick={()=>setModePopup(null)}><div className="pgIn text-center" onClick={e=>e.stopPropagation()}><div className="text-5xl mb-4">{modePopup.icon}</div><h2 className="font-display text-xl font-semibold mb-1" style={{color:"var(--ac)"}}>{modePopup.label} mode</h2><p className="font-body text-sm mb-1" style={{color:"var(--t1)"}}>{modePopup.desc}</p><p className="font-body text-xs mb-6" style={{color:"var(--t2)"}}>Session will be cleared</p><div className="flex gap-3 justify-center"><button onClick={()=>setModePopup(null)} className="px-6 py-2.5 rounded-xl font-body text-sm" style={{background:"var(--bg2)",color:"var(--t2)",border:"1px solid var(--brd)"}}>Cancel</button><button onClick={confirmModeSwitch} className="btn px-6 py-2.5 text-sm">Activate</button></div></div></div>)}

      {/* Bottom sheet settings */}
      {sheetOpen&&(<div className="sheet-overlay fixed inset-0 z-50" style={{background:"rgba(0,0,0,0.5)"}} onClick={()=>setSheetOpen(false)}><div className="sheet-panel absolute bottom-0 left-0 right-0 rounded-t-2xl" style={{background:"var(--bg1)",paddingBottom:"calc(1rem + env(safe-area-inset-bottom))"}} onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mt-2 mb-4" style={{background:"var(--brd)"}}/>
        <div className="px-5 pb-4">
          <h3 className="font-display text-sm font-semibold mb-3" style={{color:"var(--t0)"}}>Settings</h3>
          <p className="font-mono text-[10px] mb-2" style={{color:"var(--t2)"}}>THEME</p>
          <div className="flex flex-wrap gap-2 mb-3">{THEMES.map(t=><button key={t.id} onClick={()=>setTheme(t)} className={`thSwatch ${theme.id===t.id?"on":""}`} style={{background:t.color}} title={t.name}/>)}</div>
          <p className="font-body text-[11px] mb-3" style={{color:"var(--t2)"}}>{theme.name}</p>
          <p className="font-mono text-[10px] mb-2" style={{color:"var(--t2)"}}>CHAT STYLE</p>
          <div className="flex flex-wrap gap-1.5 mb-4">{CHAT_STYLES.map(s=><button key={s.id} onClick={()=>setChatStyle(s)} className={`mpill ${chatStyle.id===s.id?"on":""}`} style={{fontSize:"11px"}}>{s.name}</button>)}</div>
          {/* Profile */}
          <div className="flex items-center gap-3 pt-3" style={{borderTop:"1px solid var(--brd)"}}>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-display font-bold" style={{background:"var(--ac)",color:"var(--bg0)"}}>{ME.name.split(" ").map(n=>n[0]).join("")}</div>
            <div><h4 className="font-display text-sm font-semibold" style={{color:"var(--t0)"}}>{ME.name}</h4><p className="font-body text-[11px]" style={{color:"var(--t2)"}}>{ME.role} · {ME.location}</p></div>
          </div>
        </div>
      </div></div>)}

      {/* HEADER — collapses on scroll */}
      <header className="header-full sticky top-0 z-40 border-b px-4" style={{borderColor:"var(--brd)",background:"color-mix(in srgb, var(--bg0) 80%, transparent)",backdropFilter:"blur(16px)",paddingTop:"calc(0.5rem + env(safe-area-inset-top))",paddingBottom:"0.5rem"}}>
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AetherLogo size={scrolled?24:32}/>
            {!scrolled&&<div className="flex items-baseline gap-1.5"><span className="font-display text-[15px] font-bold tracking-tight" style={{color:"var(--t0)"}}>Aether</span><span className="hidden sm:inline font-body text-[9px] tracking-[0.15em] uppercase" style={{color:"var(--ac)",opacity:0.6}}>ai</span></div>}
          </div>
          {/* Settings button */}
          <button onClick={()=>setSheetOpen(true)} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{border:"1px solid var(--brd)",background:"var(--bg1)"}} title="Settings"><div className="h-3.5 w-3.5 rounded-full" style={{background:theme.color}}/></button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-3 py-2" style={{height:"calc(100vh - 110px - env(safe-area-inset-top) - env(safe-area-inset-bottom))"}}>
        {tab==="chat"&&chatArea(false)}
        {tab==="code"&&chatArea(true)}
        {tab==="image"&&(
          <div className="pgIn h-full overflow-y-auto">
            <div className="glass p-4 mb-4">
              <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar">{IMG_MODELS.map(m=><button key={m.id} onClick={()=>setImgM(m)} className={`mpill shrink-0 ${imgM.id===m.id?"on":""}`}>{m.label}</button>)}</div>
              <textarea ref={imgRef} value={imgP} onChange={e=>setImgP(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)){e.preventDefault();genImg()}}} placeholder="Describe your image..." rows={2} className="w-full resize-none rounded-xl px-4 py-3 font-body text-sm mb-2.5" style={{border:"1px solid var(--brd)",background:"var(--bg0)",color:"var(--t0)"}}/>
              <div className="flex justify-between items-center">
                <button onClick={()=>setImgP(["Cyberpunk market, neon, rain","Zen garden, isometric, tilt-shift","Steampunk owl, clocktower","Cabin in snowstorm, fireplace"][Math.floor(Math.random()*4)])} className="font-body text-[11px] hover:opacity-80" style={{color:"var(--t2)"}}>✦ Inspire</button>
                <button onClick={genImg} disabled={!imgP.trim()||imgBusy} className="btn px-5 py-2 text-sm">{imgBusy?`${imgSec}s...`:"Generate"}</button>
              </div>
              {imgBusy&&<div className="mt-2 flex items-center gap-2"><PulseDots/><span className="font-mono text-[10px]" style={{color:"var(--t2)"}}>{imgSec<10?"Starting...":"Creating..."}</span></div>}
              {imgErr&&<p className="mt-2 text-xs" style={{color:"#e85535"}}>{imgErr}</p>}
            </div>
            {imgs.length>0&&<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{imgs.map((img,i)=><div key={img.ts+""+i} className="imgRv glass group overflow-hidden cursor-pointer" onClick={()=>setLb(img)}><div className="relative aspect-square overflow-hidden"><img src={img.url} alt={img.prompt} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"/><div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity"><div className="w-full p-2"><p className="text-[10px] text-gray-300 line-clamp-1">{img.prompt}</p></div></div></div></div>)}</div>}
          </div>
        )}
      </main>

      {/* BOTTOM NAV BAR */}
      <nav className="sticky bottom-0 z-40 border-t" style={{borderColor:"var(--brd)",background:"color-mix(in srgb, var(--bg0) 85%, transparent)",backdropFilter:"blur(16px)",paddingBottom:"env(safe-area-inset-bottom)"}}>
        <div className="mx-auto max-w-5xl flex items-center justify-around py-1.5">
          {([["chat","💬","Chat"],["code","⌘","Code"],["image","🎨","Create"]] as [Tab,string,string][]).map(([k,ic,lb])=>(
            <button key={k} onClick={()=>{if(busy){alert("Wait for response");return}setTab(k)}} className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all" style={tab===k?{color:"var(--ac)"}:{color:"var(--t2)"}}>
              <span className="text-base">{ic}</span>
              <span className="text-[10px] font-medium">{lb}</span>
              {tab===k&&<div className="w-4 h-0.5 rounded-full mt-0.5" style={{background:"var(--ac)"}}/>}
            </button>
          ))}
        </div>
      </nav>

      {/* Lightbox */}
      {lb&&(<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.9)",backdropFilter:"blur(8px)"}} onClick={()=>setLb(null)}><div className="imgRv max-h-[90vh] max-w-[90vw]" onClick={e=>e.stopPropagation()}><img src={lb.url} alt="" className="max-h-[84vh] rounded-2xl object-contain"/><div className="mt-2 glass flex items-center justify-between px-3 py-2"><p className="truncate font-body text-xs mr-3" style={{color:"var(--t1)"}}>{lb.prompt}</p><div className="flex gap-1.5 shrink-0"><button onClick={()=>dlImg(lb)} className="btn px-2.5 py-1 text-[10px]">Save</button><button onClick={()=>setLb(null)} className="mpill text-[10px]">✕</button></div></div></div></div>)}
    </div>
  );
}