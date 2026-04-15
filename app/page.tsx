"use client";
import { useState, useRef, useEffect } from "react";

// ════════════════════════════════════════════════════════
// EDIT YOUR PROFILE
// ════════════════════════════════════════════════════════
const ME = {
  name: "Hari Rajanala",
  role: "Software Architect",
  bio: "Software Architect with 7+ years in C#/.NET Core, React, Angular, TypeScript, and cloud platforms. Crafting AI-powered applications that simplify complex workflows. Creator of Aether.",
  avatar: "",
  location: "Hyderabad, India",
  skills: ["C#/.NET Core","React","TypeScript","Angular","SQL Server","Azure","Next.js","AI/ML","Healthcare Tech"],
  links: [
    { label: "GitHub", url: "https://github.com/rharihn52-hari" },
    { label: "LinkedIn", url: "https://linkedin.com/in/EDIT-HERE" },
    { label: "Email", url: "mailto:EDIT@EMAIL.COM" },
  ],
};

// ════════════════════════════════════════════════════════
const THEMES = [
  { id:"obsidian-gold", name:"Obsidian & Gold", color:"#e8a84c" },
  { id:"arctic-aurora", name:"Arctic Aurora", color:"#2dd4a8" },
  { id:"neon-tokyo", name:"Neon Tokyo", color:"#f43f7a" },
  { id:"deep-sapphire", name:"Deep Sapphire", color:"#4a8ff7" },
  { id:"sakura-noir", name:"Sakura Noir", color:"#e8879a" },
  { id:"ember-ash", name:"Ember & Ash", color:"#e85535" },
  { id:"phantom-violet", name:"Phantom Violet", color:"#a78bfa" },
  { id:"mint-matrix", name:"Mint Matrix", color:"#4ade80" },
  { id:"copper-circuit", name:"Copper Circuit", color:"#d4915c" },
  { id:"frost-ice", name:"Frost & Ice", color:"#7ec8e8" },
];

const CHAT_STYLES = [
  { id:"gradient", name:"Gradient edge" },
  { id:"slack", name:"Slack-style" },
  { id:"gpt", name:"ChatGPT-style" },
  { id:"naked", name:"Naked flow" },
  { id:"terminal", name:"Terminal" },
  { id:"imsg", name:"iMessage" },
];

const MODES = [
  { id:"swift", icon:"⚡", label:"Swift", desc:"Fast, concise answers" },
  { id:"think", icon:"◈", label:"Think", desc:"Step-by-step reasoning" },
  { id:"beast", icon:"✦", label:"Beast", desc:"Maximum depth & detail" },
  { id:"search", icon:"◎", label:"Search", desc:"Real-time knowledge" },
];

const IMG_MODELS = [
  { id:"turbo", label:"Turbo" },{ id:"flux", label:"Flux" },
  { id:"flux-realism", label:"Realism" },{ id:"flux-anime", label:"Anime" },{ id:"flux-3d", label:"3D" },
];

const STARTERS = ["Explain quantum computing simply","Write a Python REST API with FastAPI","Compare React vs Angular for enterprise","Help me write a cover letter"];
const CODE_STARTERS = ["Build a REST API in Node.js with Express","Write a React hook for infinite scroll","Debug: why does useEffect run twice","Convert this SQL query to LINQ C#"];
const IMG_STARTERS = ["Cyberpunk street market, neon signs, rain reflections","Isometric miniature zen garden, tilt-shift","Steampunk owl on clocktower, brass gears","Cozy cabin during snowstorm, fireplace"];

type Tab="chat"|"code"|"image";
interface Msg{role:"user"|"assistant";content:string;ts:number}
interface Img{url:string;prompt:string;model:string;ts:number}

// ── Code block extractor ──
function CodeBlock({code,lang}:{code:string;lang:string}){
  const [copied,setCopied]=useState(false);
  const copy=()=>{navigator.clipboard.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),2000)};
  return(
    <div className="my-2 rounded-xl overflow-hidden" style={{border:"1px solid var(--brd)"}}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{background:"var(--bg3)"}}>
        <span className="font-mono text-[10px]" style={{color:"var(--ac)"}}>{lang||"code"}</span>
        <button onClick={copy} className="font-mono text-[10px] px-2 py-0.5 rounded" style={{color:copied?"var(--ac)":"var(--t2)",background:"var(--bg2)"}}>{copied?"Copied!":"Copy"}</button>
      </div>
      <pre className="p-3 overflow-x-auto" style={{background:"var(--bg0)",margin:0}}><code className="font-mono text-xs" style={{color:"var(--t1)"}}>{code}</code></pre>
    </div>
  );
}

// ── Markdown renderer ──
function Md({text}:{text:string}){
  const lines=text.split("\n"),out:JSX.Element[]=[];
  let inC=false,cb:string[]=[],cLang="";
  lines.forEach((l,i)=>{
    if(l.startsWith("```")){if(inC){out.push(<CodeBlock key={i} code={cb.join("\n")} lang={cLang}/>);cb=[];inC=false;}else{cLang=l.slice(3).trim();inC=true;}return;}
    if(inC){cb.push(l);return;}
    if(l.startsWith("### "))out.push(<h3 key={i} className="text-sm font-semibold mt-2 mb-0.5" style={{color:"var(--t0)"}}>{l.slice(4)}</h3>);
    else if(l.startsWith("## "))out.push(<h2 key={i} className="text-[15px] font-semibold mt-2 mb-0.5" style={{color:"var(--t0)"}}>{l.slice(3)}</h2>);
    else if(l.startsWith("# "))out.push(<h1 key={i} className="text-base font-bold mt-2 mb-1" style={{color:"var(--t0)"}}>{l.slice(2)}</h1>);
    else if(l.startsWith("- ")||l.startsWith("* "))out.push(<li key={i} className="ml-4 list-disc text-sm leading-relaxed" style={{color:"var(--t1)"}}>{inl(l.slice(2))}</li>);
    else if(/^\d+\.\s/.test(l))out.push(<li key={i} className="ml-4 list-decimal text-sm leading-relaxed" style={{color:"var(--t1)"}}>{inl(l.replace(/^\d+\.\s/,""))}</li>);
    else if(l.startsWith("> "))out.push(<blockquote key={i} className="text-sm italic my-1 pl-3" style={{borderLeft:"2px solid var(--acd)",color:"var(--t2)"}}>{l.slice(2)}</blockquote>);
    else if(l.trim()==="")out.push(<div key={i} className="h-1"/>);
    else out.push(<p key={i} className="text-sm leading-relaxed" style={{color:"var(--t1)"}}>{inl(l)}</p>);
  });
  if(inC&&cb.length)out.push(<CodeBlock key="last" code={cb.join("\n")} lang={cLang}/>);
  return<div>{out}</div>;
}
function inl(t:string):React.ReactNode{
  return t.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p,i)=>{
    if(p.startsWith("**")&&p.endsWith("**"))return<strong key={i} style={{color:"var(--t0)"}}>{p.slice(2,-2)}</strong>;
    if(p.startsWith("*")&&p.endsWith("*"))return<em key={i}>{p.slice(1,-1)}</em>;
    if(p.startsWith("`")&&p.endsWith("`"))return<code key={i} className="font-mono text-[0.82em] px-1 py-0.5 rounded" style={{background:"rgba(255,255,255,0.04)",color:"var(--ac)"}}>{p.slice(1,-1)}</code>;
    return p;
  });
}

// ── Loaders ──
function PulseDots(){return<div className="flex gap-1.5">{[0,1,2].map(i=><div key={i} className="pdot" style={{animationDelay:`${i*0.2}s`}}/>)}</div>}
function DnaHelix(){return<div className="flex gap-1.5 items-center h-6">{[0,1,2,3,4].map(i=><div key={i} className="flex flex-col items-center gap-1"><div className="dna-t" style={{animationDelay:`${i*0.15}s`}}/><div className="dna-b" style={{animationDelay:`${i*0.15}s`}}/></div>)}</div>}

// ── Chat message component ──
function ChatMessage({m,style}:{m:Msg;style:string}){
  const isU=m.role==="user";
  const time=new Date(m.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  const av=<div className="h-4 w-4 rounded-md flex items-center justify-center text-[7px] font-bold shrink-0" style={{background:"var(--ac)",color:"var(--bg0)"}}>Ae</div>;

  if(style==="gradient") return(
    <div>
      {isU?<div className="text-right py-1"><span className="text-sm" style={{color:"var(--t1)"}}>{m.content}</span></div>
      :<div className="py-2 px-3 rounded-lg" style={{background:"linear-gradient(90deg,rgba(var(--ac-rgb,74,143,247),0.08) 0%,transparent 4%)"}}>
        <div className="flex items-center gap-1.5 mb-1">{av}<span className="font-display text-[10px] font-medium" style={{color:"var(--t1)"}}>Aether</span><span className="text-[8px]" style={{color:"var(--t2)"}}>{time}</span></div>
        <Md text={m.content}/>
      </div>}
    </div>
  );
  if(style==="slack") return(
    <div className="flex gap-2 py-1">
      {isU?<div className="h-5 w-5 rounded-md flex items-center justify-center text-[8px] font-bold shrink-0" style={{background:"var(--bg3)",color:"var(--t2)"}}>{ME.name[0]}</div>:av}
      <div>
        <div className="flex items-center gap-1.5"><span className="text-[10px] font-semibold" style={{color:isU?"var(--t2)":"var(--ac)"}}>{isU?"You":"Aether"}</span><span className="text-[8px]" style={{color:"var(--t2)"}}>{time}</span></div>
        {isU?<p className="text-sm" style={{color:"var(--t1)"}}>{m.content}</p>:<Md text={m.content}/>}
      </div>
    </div>
  );
  if(style==="gpt") return(
    <div className="py-2 px-3 rounded-lg" style={isU?{}:{background:"rgba(var(--ac-rgb,74,143,247),0.03)"}}>
      {!isU&&<div className="flex items-center gap-1.5 mb-1">{av}<span className="text-[10px] font-semibold" style={{color:"var(--ac)"}}>Aether</span></div>}
      {isU?<p className="text-sm" style={{color:"var(--t1)"}}>{m.content}</p>:<Md text={m.content}/>}
    </div>
  );
  if(style==="naked") return(
    <div>
      {isU?<div className="text-right py-1"><span className="text-sm" style={{color:"var(--t2)"}}>{m.content}</span></div>
      :<div className="py-1 pl-3" style={{borderLeft:"2px solid var(--ac)",borderRadius:0}}>
        <div className="flex items-center gap-1.5 mb-0.5">{av}<span className="text-[10px]" style={{color:"var(--t2)"}}>Aether</span></div>
        <Md text={m.content}/>
      </div>}
    </div>
  );
  if(style==="terminal") return(
    <div className="font-mono text-xs py-0.5">
      {isU?<div><span style={{color:"var(--ac)"}}>you &gt;</span> <span style={{color:"var(--t2)"}}>{m.content}</span></div>
      :<div><span style={{color:"var(--ac)"}}>aether &gt;</span> <span style={{color:"var(--t0)"}}><Md text={m.content}/></span></div>}
    </div>
  );
  // imsg
  return(
    <div className={`max-w-[85%] ${isU?"ml-auto":""}`}>
      <div className="px-3 py-2 text-sm" style={isU?{background:"rgba(var(--ac-rgb,74,143,247),0.1)",borderRadius:"14px 14px 4px 14px",color:"var(--t0)"}:{background:"var(--bg2)",borderRadius:"14px 14px 14px 4px"}}>
        {isU?m.content:<Md text={m.content}/>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
export default function Home(){
  const [splash,setSplash]=useState(true);
  const [theme,setTheme]=useState(THEMES[3]); // Deep Sapphire default
  const [chatStyle,setChatStyle]=useState(CHAT_STYLES[0]); // gradient default
  const [tab,setTab]=useState<Tab>("chat");
  const [profOpen,setProfOpen]=useState(false);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [modePopup,setModePopup]=useState<typeof MODES[0]|null>(null);

  const [chatMsgs,setChatMsgs]=useState<Msg[]>([]);
  const [codeMsgs,setCodeMsgs]=useState<Msg[]>([]);
  const [input,setInput]=useState("");
  const [mode,setMode]=useState(MODES[1]);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState("");

  const [imgP,setImgP]=useState("");
  const [imgM,setImgM]=useState(IMG_MODELS[0]);
  const [imgBusy,setImgBusy]=useState(false);
  const [imgSec,setImgSec]=useState(0);
  const [imgs,setImgs]=useState<Img[]>([]);
  const [imgErr,setImgErr]=useState("");
  const [lb,setLb]=useState<Img|null>(null);

  const chatEnd=useRef<HTMLDivElement>(null);
  const inpRef=useRef<HTMLTextAreaElement>(null);
  const imgRef=useRef<HTMLTextAreaElement>(null);
  const tmr=useRef<NodeJS.Timeout|null>(null);

  useEffect(()=>{setTimeout(()=>setSplash(false),2200)},[]);
  useEffect(()=>{document.documentElement.setAttribute("data-theme",theme.id)},[theme]);
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"})},[chatMsgs,codeMsgs,busy]);
  useEffect(()=>{if(inpRef.current){inpRef.current.style.height="auto";inpRef.current.style.height=Math.min(inpRef.current.scrollHeight,150)+"px"}},[input]);
  useEffect(()=>{if(imgRef.current){imgRef.current.style.height="auto";imgRef.current.style.height=Math.min(imgRef.current.scrollHeight,150)+"px"}},[imgP]);
  useEffect(()=>{
    if(imgBusy){setImgSec(0);tmr.current=setInterval(()=>setImgSec(s=>s+1),1000)}
    else if(tmr.current)clearInterval(tmr.current);
    return()=>{if(tmr.current)clearInterval(tmr.current)};
  },[imgBusy]);

  const msgs=tab==="code"?codeMsgs:chatMsgs;
  const setMsgs=tab==="code"?setCodeMsgs:setChatMsgs;

  const sendMsg=async(text?:string,forceMode?:string)=>{
    const c=(text||input).trim();if(!c||busy)return;
    const um:Msg={role:"user",content:c,ts:Date.now()};
    const curMsgs=tab==="code"?codeMsgs:chatMsgs;
    const setter=tab==="code"?setCodeMsgs:setChatMsgs;
    setter(p=>[...p,um]);setInput("");setBusy(true);setErr("");
    try{
      const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[...curMsgs,um].map(m=>({role:m.role,content:m.content})),mode:forceMode||mode.id})});
      const d=await r.json();if(!r.ok)throw new Error(d.error);
      setter(p=>[...p,{role:"assistant",content:d.content,ts:Date.now()}]);
    }catch(e:any){setErr(e?.message||"Failed")}finally{setBusy(false)}
  };

  const trySetMode=(m:typeof MODES[0])=>{
    if(m.id===mode.id)return;
    if(chatMsgs.length>0){setModePopup(m);return;}
    setMode(m);
  };
  const confirmModeSwitch=()=>{
    if(modePopup){setChatMsgs([]);setMode(modePopup);setModePopup(null);}
  };

  const genImg=async()=>{
    if(!imgP.trim()||imgBusy)return;setImgBusy(true);setImgErr("");
    try{
      const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:imgP.trim(),model:imgM.id})});
      const d=await r.json();if(!r.ok)throw new Error(d.error);
      setImgs(p=>[{url:d.url,prompt:imgP.trim(),model:imgM.label,ts:Date.now()},...p]);
    }catch(e:any){setImgErr(e?.message||"Failed")}finally{setImgBusy(false)}
  };

  const expPDF=async()=>{const j=(await import("jspdf")).default;const d=new j();d.setFont("helvetica","bold");d.setFontSize(16);d.text("Aether — Chat Export",20,20);d.setFont("helvetica","normal");d.setFontSize(9);d.text(new Date().toLocaleString(),20,27);let y=36;msgs.forEach(m=>{d.setFont("helvetica","bold");d.setFontSize(9);d.setTextColor(m.role==="user"?100:80,m.role==="user"?130:100,m.role==="user"?200:180);d.text(m.role==="user"?"You:":"Aether AI:",20,y);y+=5;d.setFont("helvetica","normal");d.setTextColor(50,50,50);d.splitTextToSize(m.content,170).forEach((l:string)=>{if(y>280){d.addPage();y=20}d.text(l,20,y);y+=4.5});y+=3});d.save(`aether-${tab}-${Date.now()}.pdf`)};
  const expXL=async()=>{const X=await import("xlsx");const ws=X.utils.json_to_sheet(msgs.map(m=>({Role:m.role==="user"?"You":"Aether AI",Message:m.content,Time:new Date(m.ts).toLocaleString()})));ws["!cols"]=[{wch:10},{wch:80},{wch:18}];const wb=X.utils.book_new();X.utils.book_append_sheet(wb,ws,"Chat");X.writeFile(wb,`aether-${tab}-${Date.now()}.xlsx`)};
  const dlImg=(img:Img)=>{const a=document.createElement("a");a.href=img.url;a.download=`aether-${img.ts}.png`;document.body.appendChild(a);a.click();document.body.removeChild(a)};

  const Loader=mode.id==="beast"||(tab==="code")?DnaHelix:PulseDots;

  // ── SPLASH ──
  if(splash)return(
    <div className="splash fixed inset-0 z-50 flex flex-col items-center justify-center" style={{background:"var(--bg0)"}}>
      <div className="relative splash-logo">
        <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-lg font-display font-bold shadow-2xl" style={{background:"var(--ac)",color:"var(--bg0)",boxShadow:"0 0 40px var(--acg2)"}}>Ae</div>
        <div className="splash-ring absolute inset-0 rounded-2xl border-2 opacity-0" style={{borderColor:"var(--ac)"}}/>
      </div>
      <h1 className="font-display text-2xl font-semibold mt-5 tracking-tight" style={{color:"var(--t0)"}}>Aether</h1>
      <p className="font-body text-xs mt-1" style={{color:"var(--t2)"}}>Beyond ordinary intelligence</p>
      <div className="mt-6"><PulseDots/></div>
    </div>
  );

  return(
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* ── MODE SWITCH POPUP (#10 Full Takeover) ── */}
      {modePopup&&(
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)"}} onClick={()=>setModePopup(null)}>
          <div className="pgIn text-center" onClick={e=>e.stopPropagation()}>
            <div className="text-5xl mb-4">{modePopup.icon}</div>
            <h2 className="font-display text-xl font-semibold mb-1" style={{color:"var(--ac)"}}>{modePopup.label} mode</h2>
            <p className="font-body text-sm mb-1" style={{color:"var(--t1)"}}>{modePopup.desc}</p>
            <p className="font-body text-xs mb-6" style={{color:"var(--t2)"}}>Current session will be cleared</p>
            <div className="flex gap-3 justify-center">
              <button onClick={()=>setModePopup(null)} className="px-6 py-2.5 rounded-xl font-body text-sm" style={{background:"var(--bg2)",color:"var(--t2)",border:"1px solid var(--brd)"}}>Cancel</button>
              <button onClick={confirmModeSwitch} className="btn px-6 py-2.5 text-sm">Activate</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 border-b px-4 py-2" style={{borderColor:"var(--brd)",background:"color-mix(in srgb, var(--bg0) 85%, transparent)",backdropFilter:"blur(16px)"}}>
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center text-[11px] font-display font-bold tracking-tight" style={{background:"var(--ac)",color:"var(--bg0)",boxShadow:"0 0 20px var(--acg2)"}}>Ae</div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[15px] font-bold tracking-tight" style={{color:"var(--t0)"}}>Aether</span>
              <span className="hidden sm:inline font-body text-[9px] tracking-[0.15em] uppercase" style={{color:"var(--ac)",opacity:0.6}}>ai</span>
            </div>
          </div>

          <div className="flex gap-0.5 rounded-xl p-0.5" style={{background:"var(--bg1)",border:"1px solid var(--brd)"}}>
            {([["chat","💬","Chat"],["code","⌘","Code"],["image","🎨","Create"]] as [Tab,string,string][]).map(([k,ic,lb])=>(
              <button key={k} onClick={()=>{if(busy){alert("Wait for response");return;}setTab(k);}} className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-body text-xs transition-all" style={tab===k?{background:"var(--ac)",color:"var(--bg0)",fontWeight:600}:{color:"var(--t2)"}}><span className="text-[10px]">{ic}</span>{lb}</button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={()=>{setSettingsOpen(!settingsOpen);setProfOpen(false)}} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{border:"1px solid var(--brd)",background:"var(--bg1)"}} title="Settings">
              <div className="h-3.5 w-3.5 rounded-full" style={{background:theme.color}}/>
            </button>
            <button onClick={()=>{setProfOpen(!profOpen);setSettingsOpen(false)}} className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all group" style={{border:`1px solid ${profOpen?"var(--ac)":"var(--brd)"}`,background:profOpen?"var(--acg)":"var(--bg1)"}}>
              {ME.avatar?<img src={ME.avatar} className="h-6 w-6 rounded-full object-cover" alt=""/>:
                <div className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{background:"var(--ac)",color:"var(--bg0)"}}>{ME.name.split(" ").map(n=>n[0]).join("")}</div>}
              <div className="hidden sm:flex flex-col items-start">
                <span className="font-body text-[11px] font-medium leading-none" style={{color:"var(--t0)"}}>{ME.name.split(" ")[0]}</span>
                <span className="font-body text-[8px] leading-none mt-0.5" style={{color:"var(--t2)"}}>{ME.role}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Settings panel — themes + chat style */}
        {settingsOpen&&(
          <div className="thPanel border-t mt-2 pt-3 pb-2" style={{borderColor:"var(--brd)"}}>
            <div className="mx-auto max-w-5xl">
              <p className="font-mono text-[10px] mb-2" style={{color:"var(--t2)"}}>THEME</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {THEMES.map(t=><button key={t.id} onClick={()=>setTheme(t)} className={`thSwatch ${theme.id===t.id?"on":""}`} style={{background:t.color}} title={t.name}/>)}
              </div>
              <p className="font-body text-[11px] mb-3" style={{color:"var(--t2)"}}>{theme.name}</p>
              <p className="font-mono text-[10px] mb-2" style={{color:"var(--t2)"}}>CHAT STYLE</p>
              <div className="flex flex-wrap gap-1.5">
                {CHAT_STYLES.map(s=><button key={s.id} onClick={()=>setChatStyle(s)} className={`mpill ${chatStyle.id===s.id?"on":""}`} style={{fontSize:"11px"}}>{s.name}</button>)}
              </div>
            </div>
          </div>
        )}

        {/* Profile panel */}
        {profOpen&&(
          <div className="profX border-t mt-2 pt-4 pb-3" style={{borderColor:"var(--brd)"}}>
            <div className="mx-auto max-w-5xl flex flex-col sm:flex-row gap-5">
              <div className="flex items-center gap-3">
                {ME.avatar?<img src={ME.avatar} className="h-16 w-16 rounded-2xl object-cover border-2" style={{borderColor:"var(--acg2)"}} alt=""/>:
                  <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-display font-bold" style={{background:"var(--ac)",color:"var(--bg0)"}}>{ME.name.split(" ").map(n=>n[0]).join("")}</div>}
                <div>
                  <h2 className="font-display text-base font-semibold" style={{color:"var(--t0)"}}>{ME.name}</h2>
                  <p className="font-body text-xs" style={{color:"var(--ac)"}}>{ME.role}</p>
                  <p className="font-body text-[11px]" style={{color:"var(--t2)"}}>{ME.location}</p>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-body text-sm leading-relaxed mb-2" style={{color:"var(--t1)"}}>{ME.bio}</p>
                <div className="flex flex-wrap gap-1 mb-2">{ME.skills.map(s=><span key={s} className="rounded-md px-2 py-0.5 font-mono text-[10px]" style={{background:"var(--bg2)",border:"1px solid var(--brd)",color:"var(--t2)"}}>{s}</span>)}</div>
                <div className="flex gap-2">{ME.links.map(l=><a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="rounded-lg px-3 py-1 font-body text-[11px] transition-all hover:opacity-80" style={{border:"1px solid var(--brd)",color:"var(--t2)"}}>{l.label} ↗</a>)}</div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-4">
        {/* ═══ CHAT ═══ */}
        {tab==="chat"&&(
          <div className="pgIn flex flex-col h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-1">{MODES.map(m=><button key={m.id} onClick={()=>trySetMode(m)} className={`mpill ${mode.id===m.id?"on":""}`}><span className="mr-1">{m.icon}</span>{m.label}</button>)}</div>
              {chatMsgs.length>0&&<div className="flex gap-1">
                <button onClick={expPDF} className="mpill text-[10px]">PDF ↓</button>
                <button onClick={expXL} className="mpill text-[10px]">XLS ↓</button>
                <button onClick={()=>{if(confirm("Clear?"))setChatMsgs([])}} className="mpill text-[10px]">✕</button>
              </div>}
            </div>
            <p className="font-body text-[10px] mb-2" style={{color:"var(--t2)"}}>{mode.icon} {mode.desc}</p>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 pb-3">
              {chatMsgs.length===0&&!busy&&(
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-base font-display font-bold mb-4" style={{background:"var(--acg)",color:"var(--ac)"}}>Ae</div>
                  <h2 className="font-display text-lg font-semibold mb-1" style={{color:"var(--t1)"}}>What can I help with?</h2>
                  <p className="font-body text-xs text-center max-w-sm mb-5" style={{color:"var(--t2)"}}>Ask anything. Write code. Create content. Export as PDF or Excel.</p>
                  <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                    {STARTERS.map(s=><button key={s} onClick={()=>sendMsg(s)} className="card px-3 py-2.5 text-left font-body text-xs transition-all hover:border-[var(--brdh)]" style={{color:"var(--t2)"}}>{s}</button>)}
                  </div>
                </div>
              )}
              {chatMsgs.map((m,i)=><ChatMessage key={i} m={m} style={chatStyle.id}/>)}
              {busy&&<div className="flex items-center gap-2.5 py-2"><Loader/><span className="font-mono text-[10px] animate-pulse" style={{color:"var(--t2)"}}>{mode.id==="beast"?"Deep processing...":mode.id==="swift"?"On it...":"Thinking..."}</span></div>}
              {err&&<p className="text-xs py-1" style={{color:"#e85535"}}>{err}</p>}
              <div ref={chatEnd}/>
            </div>
            <div className="card p-2 flex items-end gap-2">
              <textarea ref={inpRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg()}}} placeholder="Ask anything..." rows={1} className="flex-1 resize-none rounded-xl px-3.5 py-2.5 font-body text-sm transition-all" style={{border:"1px solid var(--brd)",background:"var(--bg0)",color:"var(--t0)"}}/>
              <button onClick={()=>sendMsg()} disabled={!input.trim()||busy} className="btn px-4 py-2.5 text-sm">{busy?"...":"Send"}</button>
            </div>
          </div>
        )}

        {/* ═══ CODE ═══ */}
        {tab==="code"&&(
          <div className="pgIn flex flex-col h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between mb-2">
              <p className="font-body text-[11px]" style={{color:"var(--t2)"}}>⌘ Optimized for code generation, debugging, and architecture</p>
              {codeMsgs.length>0&&<div className="flex gap-1">
                <button onClick={expPDF} className="mpill text-[10px]">PDF ↓</button>
                <button onClick={expXL} className="mpill text-[10px]">XLS ↓</button>
                <button onClick={()=>{if(confirm("Clear?"))setCodeMsgs([])}} className="mpill text-[10px]">✕</button>
              </div>}
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 pb-3">
              {codeMsgs.length===0&&!busy&&(
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl mb-4" style={{background:"var(--acg)",color:"var(--ac)"}}>⌘</div>
                  <h2 className="font-display text-lg font-semibold mb-1" style={{color:"var(--t1)"}}>Code anything</h2>
                  <p className="font-body text-xs text-center max-w-sm mb-5" style={{color:"var(--t2)"}}>Write, debug, refactor, explain. Production-grade code.</p>
                  <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                    {CODE_STARTERS.map(s=><button key={s} onClick={()=>sendMsg(s,"code")} className="card px-3 py-2.5 text-left font-mono text-[11px] transition-all hover:border-[var(--brdh)]" style={{color:"var(--t2)"}}>{s}</button>)}
                  </div>
                </div>
              )}
              {codeMsgs.map((m,i)=><ChatMessage key={i} m={m} style={chatStyle.id}/>)}
              {busy&&<div className="flex items-center gap-2.5 py-2"><DnaHelix/><span className="font-mono text-[10px] animate-pulse" style={{color:"var(--t2)"}}>Generating code...</span></div>}
              {err&&<p className="text-xs py-1" style={{color:"#e85535"}}>{err}</p>}
              <div ref={chatEnd}/>
            </div>
            <div className="card p-2 flex items-end gap-2">
              <textarea ref={inpRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg(undefined,"code")}}} placeholder="Describe what to build..." rows={1} className="flex-1 resize-none rounded-xl px-3.5 py-2.5 font-mono text-sm transition-all" style={{border:"1px solid var(--brd)",background:"var(--bg0)",color:"var(--t0)"}}/>
              <button onClick={()=>sendMsg(undefined,"code")} disabled={!input.trim()||busy} className="btn px-4 py-2.5 text-sm">{busy?"...":"Run"}</button>
            </div>
          </div>
        )}

        {/* ═══ IMAGE ═══ */}
        {tab==="image"&&(
          <div className="pgIn">
            <div className="card p-5 mb-5">
              <div className="flex items-center gap-1.5 mb-3">{IMG_MODELS.map(m=><button key={m.id} onClick={()=>setImgM(m)} className={`mpill ${imgM.id===m.id?"on":""}`}>{m.label}</button>)}</div>
              <textarea ref={imgRef} value={imgP} onChange={e=>setImgP(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)){e.preventDefault();genImg()}}} placeholder="Describe your image..." rows={2} className="w-full resize-none rounded-xl px-4 py-3 font-body text-sm transition-all mb-2.5" style={{border:"1px solid var(--brd)",background:"var(--bg0)",color:"var(--t0)"}}/>
              <div className="flex justify-between items-center">
                <button onClick={()=>setImgP(IMG_STARTERS[Math.floor(Math.random()*IMG_STARTERS.length)])} className="font-body text-[11px] hover:opacity-80" style={{color:"var(--t2)"}}>✦ Inspire me</button>
                <button onClick={genImg} disabled={!imgP.trim()||imgBusy} className="btn px-5 py-2 text-sm">{imgBusy?`${imgSec}s...`:"Generate"}</button>
              </div>
              {imgBusy&&<div className="mt-2 flex items-center gap-2"><PulseDots/><span className="font-mono text-[10px]" style={{color:"var(--t2)"}}>{imgSec<10?"Starting...":imgSec<25?"Creating...":"Finishing..."}</span></div>}
              {imgErr&&<p className="mt-2 text-xs" style={{color:"#e85535"}}>{imgErr}</p>}
            </div>
            {imgs.length>0?(
              <div>
                <div className="flex justify-between items-center mb-3"><span className="font-display text-sm" style={{color:"var(--t1)"}}>Gallery</span><button onClick={()=>{if(confirm("Clear?"))setImgs([])}} className="font-mono text-[10px]" style={{color:"var(--t2)"}}>Clear</button></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {imgs.map((img,i)=>(
                    <div key={img.ts+""+i} className="imgRv card group overflow-hidden cursor-pointer" onClick={()=>setLb(img)}>
                      <div className="relative aspect-square overflow-hidden">
                        <img src={img.url} alt={img.prompt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/>
                        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="w-full p-3"><p className="line-clamp-2 font-body text-[11px] text-gray-300 mb-1">{img.prompt}</p>
                            <div className="flex justify-between"><span className="font-mono text-[9px] text-gray-500">{img.model}</span><button onClick={e=>{e.stopPropagation();dlImg(img)}} className="rounded bg-white/10 px-2 py-0.5 font-mono text-[9px] text-white">Save</button></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ):!imgBusy&&(
              <div className="py-14 text-center"><div className="text-4xl opacity-15 mb-3">🎨</div><p className="font-display text-sm" style={{color:"var(--t2)"}}>Describe your vision</p></div>
            )}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lb&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.9)",backdropFilter:"blur(8px)"}} onClick={()=>setLb(null)}>
          <div className="imgRv max-h-[90vh] max-w-[90vw]" onClick={e=>e.stopPropagation()}>
            <img src={lb.url} alt="" className="max-h-[84vh] rounded-2xl object-contain"/>
            <div className="mt-2 card flex items-center justify-between px-3 py-2">
              <p className="truncate font-body text-xs mr-3" style={{color:"var(--t1)"}}>{lb.prompt}</p>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={()=>navigator.clipboard.writeText(lb.prompt)} className="mpill text-[10px]">Copy</button>
                <button onClick={()=>dlImg(lb)} className="btn px-2.5 py-1 text-[10px]">Save</button>
                <button onClick={()=>setLb(null)} className="mpill text-[10px]">✕</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t py-2.5 px-4" style={{borderColor:"var(--brd)"}}>
        <p className="text-center font-body text-[10px]" style={{color:"var(--t2)"}}>Aether · Designed by {ME.name}</p>
      </footer>
    </div>
  );
}