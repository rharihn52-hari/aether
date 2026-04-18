import { NextRequest, NextResponse } from "next/server";

const MODE_CONFIG: Record<string, { model: string; instruction: string }> = {
  swift: {
    model: "openai",
    instruction: "Be concise. 2-3 sentences max. Direct answers only.",
  },
  think: {
    model: "openai",
    instruction: "Think step by step. Be thorough. Use markdown with headers and lists.",
  },
  beast: {
    model: "openai",
    instruction: "Comprehensive expert-level response. Use code blocks with language tags, headers, examples, best practices.",
  },
  code: {
    model: "openai",
    instruction: "If asking for code: start with code block immediately. Production-grade TypeScript with types, error handling, comments. If general question: answer in plain markdown. NEVER show planning steps.",
  },
  search: {
    model: "openai",
    instruction: "Provide factual answers with dates and specifics. Be structured.",
  },
};

function detectLanguage(text: string): { isTelugu: boolean; isHindi: boolean; isNonLatin: boolean } {
  return {
    isTelugu: /[\u0C00-\u0C7F]/.test(text),
    isHindi: /[\u0900-\u097F]/.test(text),
    isNonLatin: /[^\x00-\x7F]/.test(text),
  };
}

function getTeluguPrompt(): string {
  return `

CRITICAL — USER IS WRITING IN TELUGU. YOU MUST:
1. Reply ONLY in proper Telugu script (తెలుగు లిపి). NEVER use English transliteration.
2. Use CORRECT Telugu grammar (వ్యాకరణం):
   - Proper విభక్తి ప్రత్యయాలు (case endings): -కి, -ని, -లో, -తో, -కు, -న, -యందు
   - Correct క్రియా రూపాలు (verb conjugation): చేస్తాను, చేస్తారు, చేశాడు, చేయవచ్చు, చేయగలరు, చేయాలి
   - Proper సర్వనామాలు: నేను, నువ్వు/మీరు, అతను/ఆమె, మేము, వారు
   - SOV word order: కర్త + కర్మ + క్రియ (Subject + Object + Verb)
   - Proper postpositions: మీద, కింద, వెనుక, ముందు, లోపల, బయట
   - Correct sandhi rules: అ+ఆ=ఆ, ఇ+ఇ=ఈ etc.
3. Write natural fluent Telugu as spoken in Telangana/Andhra Pradesh.
4. For tech terms with no Telugu equivalent, keep English but write everything else in Telugu.
5. NEVER produce broken Telugu like "రియాక్ట్ ఒక లైబ్రరీ ఉంది" — correct form is "రియాక్ట్ అనేది ఒక లైబ్రరీ".
6. Use proper connectors: అయితే, కానీ, మరియు, లేదా, ఎందుకంటే, అందువల్ల, కాబట్టి.`;
}

function getHindiPrompt(): string {
  return `

CRITICAL — USER IS WRITING IN HINDI. YOU MUST:
1. Reply ONLY in proper Hindi Devanagari script. NEVER transliterate.
2. Use correct Hindi grammar with proper कारक चिह्न, क्रिया रूप, and sentence structure.
3. Write natural fluent Hindi. For tech terms, keep English but write the rest in Hindi.`;
}

function cleanResponse(text: string): string {
  let cleaned = text;
  const adPatterns = [
    /\n*---\n*\*?This (?:response|text|content) was generated (?:by|using|with) Pollinations.*$/gis,
    /\n*---\n*Powered by Pollinations.*$/gis,
    /\n*\*?Generated (?:by|with|using) Pollinations.*$/gis,
    /\n*🌸.*Pollinations.*$/gim,
    /\n*\[.*pollinations.*\].*$/gim,
    /pollinations\.ai/gi,
    /\n*---\n*\*?Support (?:free|open).*AI.*$/gis,
    /\n*Made with .*Pollinations.*$/gim,
  ];
  for (const pat of adPatterns) cleaned = cleaned.replace(pat, "");

  const lines = cleaned.split("\n");
  const result: string[] = [];
  let inCode = false;
  for (const line of lines) {
    const t = line.trimStart();
    if (t.startsWith("```")) { inCode = !inCode; result.push(line); continue; }
    if (inCode) { result.push(line); continue; }
    if (/^(We need to|Let's |Let us |I need to|I will |I'll |Should |Also |Maybe |Ok\.|Okay\.|Proceed|That might|Simpler:|Parameters:|Return:|Implement |But question|Will |Going to|First,? (?:we|I)|Next,? (?:we|I)|Now,? (?:we|I))/i.test(t)) continue;
    if (/^(tsCopy|jsCopy|Copy)$/i.test(t)) continue;
    if (t.endsWith("?") && t.length < 80 && !t.startsWith("#") && !t.startsWith("-") && !t.startsWith("*")) continue;
    if (/^(Yes\.|No\.|Ok |Okay |Sure|Right|Hmm|Well,)/i.test(t) && t.length < 30) continue;
    if (/^let'?s\s+(produce|craft|create|build|write|make|design|implement|do|start|begin|go)/i.test(t)) continue;
    result.push(line);
  }
  cleaned = result.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return cleaned || text;
}

function extractText(raw: string): string {
  let text = "";
  try {
    const json = JSON.parse(raw);
    if (json?.choices?.[0]?.message?.content) text = json.choices[0].message.content;
    else if (typeof json?.content === "string" && json.content.length > 0) text = json.content;
    else if (typeof json?.reasoning_content === "string" && json.reasoning_content.length > 0) text = json.reasoning_content;
    else text = raw;
  } catch { text = raw; }
  return cleanResponse(text);
}

async function tryPost(messages: any[], model: string, timeout: number): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, model, stream: false }),
      signal: ctrl.signal,
    });
    clearTimeout(to);
    console.log(`[Aether] POST status: ${res.status}`);
    if (!res.ok) return null;
    const raw = await res.text();
    const text = extractText(raw);
    return (text && text.trim().length > 0) ? text : null;
  } catch (e: any) { console.log(`[Aether] POST error: ${e?.message}`); return null; }
}

async function tryGet(prompt: string, system: string, model: string, timeout: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({ model, system: system.slice(0, 300) });
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt.slice(0, 500))}?${params}`;
    if (url.length > 2000) return null;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);
    console.log(`[Aether] GET status: ${res.status}`);
    if (!res.ok) return null;
    const raw = await res.text();
    const text = extractText(raw);
    return (text && text.trim().length > 0) ? text : null;
  } catch (e: any) { console.log(`[Aether] GET error: ${e?.message}`); return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, mode } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Messages required" }, { status: 400 });
    const config = MODE_CONFIG[mode] || MODE_CONFIG.think;
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
    const prompt = lastUser?.content || "";
    const lang = detectLanguage(prompt);
    const langPrompt = lang.isTelugu ? getTeluguPrompt() : lang.isHindi ? getHindiPrompt() : "";
    const sys = `You are Aether AI, designed by Hari Rajanala. ${config.instruction} Output ONLY the final answer. No planning steps.${langPrompt}`;
    const fullMessages = [{ role: "system", content: sys }, ...messages.map((m: any) => ({ role: m.role, content: m.content }))];
    console.log(`[Aether] Mode: ${mode} | Telugu: ${lang.isTelugu} | Hindi: ${lang.isHindi}`);

    const postResult = await tryPost(fullMessages, config.model, 90000);
    if (postResult) return NextResponse.json({ content: postResult });

    if (!lang.isNonLatin) {
      const getResult = await tryGet(prompt, sys, config.model, 60000);
      if (getResult) return NextResponse.json({ content: getResult });
    }

    try {
      const bareRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt.slice(0, 300))}`);
      if (bareRes.ok) { const raw = await bareRes.text(); const text = extractText(raw); if (text?.trim()) return NextResponse.json({ content: text }); }
    } catch {}

    return NextResponse.json({ error: "Aether is experiencing high demand. Please wait a moment and try again." }, { status: 502 });
  } catch (e: any) {
    if (e?.name === "AbortError") return NextResponse.json({ error: "Response took too long. Try Swift mode." }, { status: 504 });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}