import { NextRequest, NextResponse } from "next/server";

const MODE_CONFIG: Record<string, { instruction: string }> = {
  swift: { instruction: "Be concise. 2-3 sentences max." },
  think: { instruction: "Think step by step. Use markdown with headers and lists." },
  beast: { instruction: "Comprehensive expert-level response. Code blocks, headers, examples, best practices." },
  code: { instruction: "If code requested: code block first. Production-grade TypeScript. If general question: plain markdown." },
  search: { instruction: "Provide factual answers with dates and specifics." },
};

function detectLanguage(text: string): string {
  if (/[\u0C00-\u0C7F]/.test(text)) return "telugu";
  if (/[\u0900-\u097F]/.test(text)) return "hindi";
  return "english";
}

function getLangPrompt(lang: string): string {
  if (lang === "telugu") return " Reply ENTIRELY in Telugu script. Proper grammar with correct విభక్తి ప్రత్యయాలు and క్రియా రూపాలు. SOV word order. No English except tech terms.";
  if (lang === "hindi") return " Reply ENTIRELY in Hindi Devanagari. Proper grammar. No English except tech terms.";
  return "";
}

function cleanAds(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|span|b|i|em|strong|a|ul|ol|li|h[1-6])[^>]*>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/pollinations\.ai/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function callGroq(messages: any[], sysPrompt: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: sysPrompt }, ...messages],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });
    if (!res.ok) { console.log(`[Aether] Groq status: ${res.status}`); return null; }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    console.log(`[Aether] Groq success (${content?.length} chars)`);
    return content ? cleanAds(content) : null;
  } catch (e: any) { console.log(`[Aether] Groq error: ${e?.message}`); return null; }
}

async function callPollinations(messages: any[], sysPrompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "system", content: sysPrompt }, ...messages],
        model: "openai",
        stream: false,
      }),
    });
    console.log(`[Aether] Pollinations status: ${res.status}`);
    if (!res.ok) return null;
    const raw = await res.text();
    // Extract from JSON if needed
    try {
      const json = JSON.parse(raw);
      const text = json?.choices?.[0]?.message?.content || json?.content || json?.reasoning_content || "";
      return text.length > 5 ? cleanAds(text) : null;
    } catch {
      return raw.length > 5 ? cleanAds(raw) : null;
    }
  } catch (e: any) { console.log(`[Aether] Pollinations error: ${e?.message}`); return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, mode } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Messages required" }, { status: 400 });

    const config = MODE_CONFIG[mode] || MODE_CONFIG.think;
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
    const lang = detectLanguage(lastUser?.content || "");
    const langPrompt = getLangPrompt(lang);

    const sys = `You are Aether AI, designed by Hari Rajanala. ${config.instruction} Start with the answer immediately. No planning steps. Use markdown. Never use tables with | characters — use lists instead.${langPrompt}`;

    const chatMessages = messages.map((m: any) => ({ role: m.role, content: m.content }));

    console.log(`[Aether] Mode: ${mode} | Lang: ${lang}`);

    // Strategy 1: Groq (fast, reliable, free)
    const groqResult = await callGroq(chatMessages, sys);
    if (groqResult) return NextResponse.json({ content: groqResult });

    // Strategy 2: Pollinations (fallback)
    console.log(`[Aether] Groq unavailable, trying Pollinations...`);
    const pollResult = await callPollinations(chatMessages, sys);
    if (pollResult) return NextResponse.json({ content: pollResult });

    // Strategy 3: Retry Pollinations after delay
    console.log(`[Aether] Retrying Pollinations in 3s...`);
    await new Promise(r => setTimeout(r, 3000));
    const retryResult = await callPollinations(chatMessages, sys);
    if (retryResult) return NextResponse.json({ content: retryResult });

    return NextResponse.json({
      error: "Aether is experiencing high demand. Please wait a moment and try again.",
    }, { status: 502 });
  } catch (e: any) {
    if (e?.name === "AbortError") return NextResponse.json({ error: "Response took too long. Try Swift mode." }, { status: 504 });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}