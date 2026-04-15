import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  try {
    const { prompt, model } = await req.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    const seed = Math.floor(Math.random()*999999);
    const p = new URLSearchParams({ width:"1024",height:"1024",seed:String(seed),model:model||"flux",nologo:"true" });
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?${p}`;
    const ctrl = new AbortController();
    const to = setTimeout(()=>ctrl.abort(),120000);
    const res = await fetch(url,{signal:ctrl.signal,redirect:"follow"});
    clearTimeout(to);
    if (!res.ok) return NextResponse.json({ error: `Failed: ${res.status}` }, { status: 502 });
    const ct = res.headers.get("content-type")||"";
    if (!ct.startsWith("image/")) return NextResponse.json({ error: "Not an image" }, { status: 502 });
    const buf = await res.arrayBuffer();
    return NextResponse.json({ url: `data:${ct};base64,${Buffer.from(buf).toString("base64")}` });
  } catch (e:any) {
    if (e?.name==="AbortError") return NextResponse.json({ error: "Timed out. Try Turbo." }, { status: 504 });
    return NextResponse.json({ error: e?.message||"Failed" }, { status: 500 });
  }
}
