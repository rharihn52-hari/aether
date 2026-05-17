import { NextRequest, NextResponse } from "next/server";

async function tryPollinations(prompt: string, model: string): Promise<string | null> {
  try {
    const seed = Math.floor(Math.random() * 999999);
    const p = new URLSearchParams({ width: "1024", height: "1024", seed: String(seed), model: model || "flux", nologo: "true" });
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${p}`;

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 120000);
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    clearTimeout(to);

    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return null;
    const buf = await res.arrayBuffer();
    return `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

async function tryTogether(prompt: string): Promise<string | null> {
  const key = process.env.TOGETHER_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.together.xyz/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "black-forest-labs/FLUX.1-schnell-Free",
        prompt,
        width: 1024,
        height: 1024,
        n: 1,
      }),
    });
    if (!res.ok) { console.log(`[Aether] Together img status: ${res.status}`); return null; }
    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (b64) return `data:image/png;base64,${b64}`;
    const url = data?.data?.[0]?.url;
    if (url) {
      const imgRes = await fetch(url);
      if (imgRes.ok) {
        const buf = await imgRes.arrayBuffer();
        return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
      }
    }
    return null;
  } catch (e: any) { console.log(`[Aether] Together img error: ${e?.message}`); return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, model } = await req.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

    console.log(`[Aether] Image: "${prompt.slice(0, 50)}..." model: ${model}`);

    // Strategy 1: Pollinations
    const pollResult = await tryPollinations(prompt.trim(), model);
    if (pollResult) {
      console.log(`[Aether] Pollinations image success`);
      return NextResponse.json({ url: pollResult });
    }

    // Strategy 2: Together AI
    console.log(`[Aether] Pollinations failed, trying Together AI...`);
    const togetherResult = await tryTogether(prompt.trim());
    if (togetherResult) {
      console.log(`[Aether] Together image success`);
      return NextResponse.json({ url: togetherResult });
    }

    return NextResponse.json({ error: "Image generation is busy. Try again in a moment." }, { status: 502 });
  } catch (e: any) {
    if (e?.name === "AbortError") return NextResponse.json({ error: "Timed out. Try a simpler prompt." }, { status: 504 });
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}