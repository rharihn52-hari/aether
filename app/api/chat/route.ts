import { NextRequest, NextResponse } from "next/server";

const MODE_CONFIG: Record<string, { instruction: string }> = {
  swift: { instruction: "Be concise. 2-3 sentences max." },
  think: { instruction: "Think step by step. Use markdown with headers and lists." },
  beast: { instruction: "Comprehensive expert-level response. Use code blocks, headers, examples." },
  code: { instruction: "RULES: 1) If the user asks for code, start with the code block immediately. Write production-grade TypeScript with types, error handling, comments. 2) If the user asks a general question (ideas, explanations, comparisons, advice), answer in plain markdown WITHOUT code. 3) NEVER show planning steps or reasoning. 4) Match the response format to what was asked." },
};

// Three endpoints to try — if one is down, try the next
const ENDPOINTS = [
  { name: "pollinations-post", type: "post" as const, url: "https://text.pollinations.ai/" },
  { name: "pollinations-get", type: "get" as const, url: "https://text.pollinations.ai/" },
];

function extractText(raw: string): string {
  try {
    const json = JSON.parse(raw);
    let text = "";
    if (json?.choices?.[0]?.message?.content) text = json.choices[0].message.content;
    else if (typeof json?.content === "string" && json.content.length > 0) text = json.content;
    else if (typeof json?.reasoning_content === "string" && json.reasoning_content.length > 0) text = json.reasoning_content;
    else text = raw;
    return cleanReasoning(text);
  } catch {
    return cleanReasoning(raw);
  }
}

function cleanReasoning(text: string): string {
  const lines = text.split("\n");
  const cleaned: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    // Always keep code blocks
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      cleaned.push(line);
      continue;
    }
    if (inCodeBlock) {
      cleaned.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Skip planning/reasoning lines
    if (/^(We need to|Let's|Let us|Should |I will |I'll |Also |Maybe |Ok\.|Okay\.|Proceed|That might|Simpler:|Parameters:|Return:|Implement |But question)/i.test(trimmed)) continue;
    if (/^(tsCopy|jsCopy|Copy)$/i.test(trimmed)) continue;
    if (trimmed.endsWith("?") && trimmed.length < 80 && !trimmed.startsWith("#")) continue;
    if (/^(Yes\.|No\.|Ok |Okay )/i.test(trimmed) && trimmed.length < 20) continue;

    cleaned.push(line);
  }

  const result = cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return result || text; // fallback to original if everything got stripped
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