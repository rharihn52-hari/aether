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
    instruction: "If asking for code: start with code block immediately. If general question: plain markdown. NEVER show planning.",
  },
  search: {
    model: "openai",
    instruction: "Provide factual answers with dates and specifics. Be structured.",
  },
};

function detectLanguage(text: string): string {
  if (/[\u0C00-\u0C7F]/.test(text)) return "telugu";
  if (/[\u0900-\u097F]/.test(text)) return "hindi";
  return "english";
}

function getLanguagePrompt(lang: string): string {
  if (lang === "telugu") return ` Reply ENTIRELY in Telugu script (తెలుగు లిపి). Proper Telugu grammar with correct విభక్తి ప్రత్యయాలు and క్రియా రూపాలు. SOV word order. No English except tech terms. Write naturally as a Telugu speaker.`;
  if (lang === "hindi") return ` Reply ENTIRELY in Hindi Devanagari. Proper grammar. No English except tech terms.`;
  return "";
}

// Instead of matching thinking patterns, find where REAL content starts
function stripThinking(text: string): string {
  const lines = text.split("\n");
  
  // Find the first line that looks like ACTUAL content (not thinking)
  let contentStart = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    
    // These are DEFINITE content markers
    if (t.startsWith("# ") || t.startsWith("## ") || t.startsWith("### ")) { contentStart = i; break; }
    if (t.startsWith("```")) { contentStart = i; break; }
    if (t.startsWith("---")) { contentStart = i; break; }
    
    // Telugu/Hindi content (starts with native script, not English thinking)
    if (/^[\u0C00-\u0C7F]/.test(t) && t.length > 20) { contentStart = i; break; }
    if (/^[\u0900-\u097F]/.test(t) && t.length > 20) { contentStart = i; break; }
    
    // Numbered list with real content (not "1. Think about..." but "1. **Title**")
    if (/^\d+\.\s+\*\*/.test(t)) { contentStart = i; break; }
    if (/^\d+\.\s+[\u0C00-\u0C7F]/.test(t)) { contentStart = i; break; }
    
    // Bullet points with real content
    if (/^[-*]\s+\*\*/.test(t)) { contentStart = i; break; }
    if (/^[-*]\s+[\u0C00-\u0C7F]/.test(t)) { contentStart = i; break; }
    
    // Bold text start (likely a section heading)
    if (t.startsWith("**") && t.includes("**") && t.length > 5) { contentStart = i; break; }
    
    // Long paragraph (>120 chars) that doesn't start with thinking words
    if (t.length > 120 && !/^(We |I |Let|Should|Maybe|Perhaps|Ok|Actually|Better|User|So |Thus |Given |For a|Thinking|Could|Would|The user)/i.test(t)) {
      contentStart = i; break;
    }
    
    // Medium paragraph that starts with a real word (not thinking)
    if (t.length > 60 && /^(Here|This|The |A |An |In |To |For |When|If |You|There|It |That|These|Those|One|Two|Three|Four|Five)/i.test(t)) {
      contentStart = i; break;
    }
  }
  
  // If no content marker found, return everything (better than nothing)
  if (contentStart === -1) return text;
  
  // Return from content start
  return lines.slice(contentStart).join("\n").trim();
}

function cleanAds(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|span|b|i|em|strong|a|ul|ol|li|h[1-6])[^>]*>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n*---\n*\*?This (?:response|text|content) was generated[\s\S]*$/gim, "")
    .replace(/\n*---\n*Powered by Pollinations.*$/gim, "")
    .replace(/\n*\*?Generated (?:by|with|using) Pollinations.*$/gim, "")
    .replace(/\n*🌸.*Pollinations.*$/gim, "")
    .replace(/pollinations\.ai/gi, "")
    .replace(/\n*Made with .*Pollinations.*$/gim, "")
    .replace(/\n*---\n*\*?Support (?:free|open).*AI.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
  
  // Step 1: Strip thinking/planning from start
  text = stripThinking(text);
  // Step 2: Clean ads and HTML
  text = cleanAds(text);
  
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, mode } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Messages required" }, { status: 400 });

    const config = MODE_CONFIG[mode] || MODE_CONFIG.think;
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
    const prompt = lastUser?.content || "";
    const lang = detectLanguage(prompt);
    const langPrompt = getLanguagePrompt(lang);

    const sys = `You are Aether AI, designed by Hari Rajanala. ${config.instruction} RULES: Start with the answer IMMEDIATELY. Never say "User:", "We need to", "Let me think". Never show planning. If giving a schedule, use markdown lists NOT tables.${langPrompt}`;

    const fullMessages = [
      { role: "system", content: sys },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    console.log(`[Aether] Mode: ${mode} | Lang: ${lang}`);

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 90000);

    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: fullMessages, model: config.model, stream: false }),
      signal: ctrl.signal,
    });
    clearTimeout(to);

    console.log(`[Aether] POST status: ${res.status}`);

    if (!res.ok) {
      return NextResponse.json({
        error: "Aether is experiencing high demand. Please wait a moment and try again.",
      }, { status: 502 });
    }

    const raw = await res.text();
    const content = extractText(raw);
    
    console.log(`[Aether] Final content (first 100): ${content.slice(0, 100)}`);

    if (!content || content.trim().length < 5) {
      return NextResponse.json({
        error: "Aether couldn't generate a response. Please try again.",
      }, { status: 502 });
    }

    return NextResponse.json({ content });
  } catch (e: any) {
    if (e?.name === "AbortError") return NextResponse.json({ error: "Response took too long. Try Swift mode." }, { status: 504 });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}