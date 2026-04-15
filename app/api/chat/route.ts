import { NextRequest, NextResponse } from "next/server";

const MODE_CONFIG: Record<string, { instruction: string }> = {
  swift: { instruction: "Be concise. 2-3 sentences max." },
  think: { instruction: "Think step by step. Use markdown with headers and lists." },
  beast: { instruction: "Comprehensive expert-level response. Use code blocks, headers, examples." },
  code: { instruction: "Write production-grade code with types, error handling, comments. Use code blocks with language tags. Output the final code directly." },
  search: { instruction: "Provide factual answers with dates and specifics." },
};

// Three endpoints to try — if one is down, try the next
const ENDPOINTS = [
  { name: "pollinations-post", type: "post" as const, url: "https://text.pollinations.ai/" },
  { name: "pollinations-get", type: "get" as const, url: "https://text.pollinations.ai/" },
];

function extractText(raw: string): string {
  try {
    const json = JSON.parse(raw);
    if (json?.choices?.[0]?.message?.content) return json.choices[0].message.content;
    if (typeof json?.content === "string" && json.content.length > 0) return json.content;
    if (typeof json?.reasoning_content === "string" && json.reasoning_content.length > 0) return json.reasoning_content;
    return raw;
  } catch {
    return raw;
  }
}

async function tryPost(prompt: string, systemPrompt: string, history: any[]): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 60000);
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
        ],
        model: "openai",
        stream: false,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(to);
    console.log(`[Aether] POST status: ${res.status}`);
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.log(`[Aether] POST error body: ${errBody.slice(0, 200)}`);
      return null;
    }
    const raw = await res.text();
    const text = extractText(raw);
    if (text && text.trim().length > 0) {
      console.log(`[Aether] POST success (${text.length} chars)`);
      return text;
    }
    return null;
  } catch (e: any) {
    console.log(`[Aether] POST exception: ${e?.message}`);
    return null;
  }
}

async function tryGet(prompt: string, systemPrompt: string): Promise<string | null> {
  try {
    // Keep URL short to avoid 414/502
    const shortSystem = systemPrompt.slice(0, 200);
    const shortPrompt = prompt.slice(0, 500);
    const params = new URLSearchParams({ model: "openai", system: shortSystem });
    const url = `https://text.pollinations.ai/${encodeURIComponent(shortPrompt)}?${params}`;
    
    console.log(`[Aether] GET url length: ${url.length}`);
    
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 60000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);
    console.log(`[Aether] GET status: ${res.status}`);
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.log(`[Aether] GET error body: ${errBody.slice(0, 200)}`);
      return null;
    }
    const text = await res.text();
    if (text && text.trim().length > 0 && !text.startsWith("{")) {
      console.log(`[Aether] GET success (${text.length} chars)`);
      return text;
    }
    // If JSON, extract
    const extracted = extractText(text);
    if (extracted && extracted.trim().length > 0) {
      console.log(`[Aether] GET extracted (${extracted.length} chars)`);
      return extracted;
    }
    return null;
  } catch (e: any) {
    console.log(`[Aether] GET exception: ${e?.message}`);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, mode } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Messages required" }, { status: 400 });

    const config = MODE_CONFIG[mode] || MODE_CONFIG.think;
    const sys = `You are Aether AI, designed by Hari Rajanala. ${config.instruction} Output ONLY the final answer. No planning steps.`;
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user");

    console.log(`[Aether] Mode: ${mode} | Prompt: "${lastUser?.content?.slice(0, 50)}..."`);

    // Strategy 1: POST with full conversation
    const postResult = await tryPost(
      lastUser?.content || "",
      sys,
      messages.map((m: any) => ({ role: m.role, content: m.content }))
    );
    if (postResult) return NextResponse.json({ content: postResult });

    // Strategy 2: GET with just the last message (shorter URL)
    console.log(`[Aether] POST failed, trying GET...`);
    const getResult = await tryGet(lastUser?.content || "", sys);
    if (getResult) return NextResponse.json({ content: getResult });

    // Strategy 3: Simplest possible GET — no system prompt
    console.log(`[Aether] GET failed, trying bare GET...`);
    try {
      const bareUrl = `https://text.pollinations.ai/${encodeURIComponent(lastUser?.content || "hello")}`;
      const bareRes = await fetch(bareUrl);
      console.log(`[Aether] Bare GET status: ${bareRes.status}`);
      if (bareRes.ok) {
        const bareText = await bareRes.text();
        const extracted = extractText(bareText);
        if (extracted && extracted.trim().length > 0) {
          console.log(`[Aether] Bare GET success`);
          return NextResponse.json({ content: extracted });
        }
      }
    } catch {}

    console.log(`[Aether] ALL strategies failed`);
    return NextResponse.json({ error: "Pollinations AI is temporarily overloaded. Wait 30 seconds and try again." }, { status: 502 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}