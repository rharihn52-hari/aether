import { NextRequest, NextResponse } from "next/server";

const MODE_CONFIG: Record<string, { model: string; fallback: string; instruction: string }> = {
  swift: {
    model: "mistral",
    fallback: "openai",
    instruction: "Be extremely concise. 2-3 sentences max. No fluff. Direct answers only.",
  },
  think: {
    model: "openai",
    fallback: "openai",
    instruction: "Think step by step. Be thorough and analytical. Explain reasoning. Use markdown formatting with headers and lists.",
  },
  beast: {
    model: "claude",
    fallback: "openai",
    instruction: "Give the most comprehensive, expert-level response possible. Output ONLY the final polished answer. Never show thinking, planning, or reasoning steps. Use detailed code blocks with language tags, structured headers, real-world examples, edge cases, and best practices.",
  },
  code: {
    model: "openai",
    fallback: "openai",
    instruction: "You are an elite software engineer. Write production-grade code with proper error handling, types, and comments. Always use code blocks with language tags. Explain architecture decisions briefly.",
  },
  search: {
    model: "gemini",
    fallback: "openai",
    instruction: "Provide current, factual, well-sourced answers. Include dates and specifics when available. Be informative and structured. Output ONLY the final answer.",
  },
};

function extractContent(raw: string): string | null {
  if (!raw || raw.trim().length === 0) return null;
  
  try {
    const json = JSON.parse(raw);
    // Priority: content > choices > reasoning_content
    if (json?.choices?.[0]?.message?.content) return json.choices[0].message.content;
    if (typeof json?.content === "string" && json.content.length > 0) return json.content;
    // reasoning_content IS the response on Pollinations
    if (typeof json?.reasoning_content === "string" && json.reasoning_content.length > 0) return json.reasoning_content;
    return raw;
  } catch {
    return raw;
  }
}

async function fetchAI(messages: any[], model: string, timeout: number): Promise<string | null> {
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

    console.log(`[Aether] ${model} status: ${res.status}`);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.log(`[Aether] ${model} error body:`, errText.slice(0, 200));
      return null;
    }

    const raw = await res.text();
    console.log(`[Aether] ${model} response (first 200):`, raw.slice(0, 200));
    return extractContent(raw);
  } catch (e: any) {
    console.log(`[Aether] ${model} fetch error:`, e?.message);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, mode } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Messages required" }, { status: 400 });

    const config = MODE_CONFIG[mode] || MODE_CONFIG.think;

    const sys = `You are Aether AI, a premium AI engine designed and built by Software Architect Hari Rajanala. When asked who you are or who made you: "I'm Aether AI, designed by Hari Rajanala, Software Architect."

${config.instruction}

Use clean markdown. Never mention your underlying model or provider.`;

    const fullMessages = [
      { role: "system", content: sys },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    console.log(`[Aether] Mode: ${mode} → Trying: ${config.model}`);

    // Try primary model
    const result = await fetchAI(fullMessages, config.model, 90000);
    if (result) {
      console.log(`[Aether] ${config.model} succeeded`);
      return NextResponse.json({ content: result });
    }

    // Fallback
    if (config.fallback !== config.model) {
      console.log(`[Aether] ${config.model} failed → Falling back to ${config.fallback}`);
      const fallbackResult = await fetchAI(fullMessages, config.fallback, 60000);
      if (fallbackResult) {
        return NextResponse.json({ content: fallbackResult });
      }
    }

    return NextResponse.json({ error: "AI is busy. Try again in a moment." }, { status: 502 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}