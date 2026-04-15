import { NextRequest, NextResponse } from "next/server";

const MODE_CONFIG: Record<string, { model: string; instruction: string }> = {
  swift: {
    model: "mistral",
    instruction: "Be concise. 2-3 sentences max. Direct answers only.",
  },
  think: {
    model: "openai",
    instruction: "Think step by step. Be thorough. Use markdown with headers and lists.",
  },
  beast: {
    model: "openai",
    instruction: "Give the most comprehensive expert-level response. Use code blocks with language tags, headers, examples, and best practices.",
  },
  code: {
    model: "openai",
    instruction: "You are an elite software engineer. Write production-grade code with error handling, types, comments. Always use code blocks with language tags.",
  },
  search: {
    model: "openai",
    instruction: "Provide current, factual answers. Include dates and specifics. Be structured.",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { messages, mode } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Messages required" }, { status: 400 });

    const config = MODE_CONFIG[mode] || MODE_CONFIG.think;

    // Get last user message
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
    if (!lastUser) return NextResponse.json({ error: "No user message" }, { status: 400 });

    const systemPrompt = `You are Aether AI, designed by Software Architect Hari Rajanala. When asked who you are: "I'm Aether AI, designed by Hari Rajanala." ${config.instruction} Use clean markdown. Never mention your underlying model.`;

    // Build context from recent messages
    const recent = messages.slice(-6);
    let contextPrompt = "";
    if (recent.length > 1) {
      const history = recent.slice(0, -1);
      contextPrompt = "Previous conversation:\n" + history.map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n") + "\n\nNow answer this:\n";
    }

    const fullPrompt = contextPrompt + lastUser.content;

    // Use GET endpoint — returns clean plain text, no JSON reasoning dumps
    const params = new URLSearchParams({
      model: config.model,
      system: systemPrompt,
    });

    const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?${params}`;

    console.log(`[Aether] Mode: ${mode} → Model: ${config.model}`);

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 90000);

    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);

    console.log(`[Aether] Status: ${res.status}`);

    if (!res.ok) {
      // Fallback with openai
      if (config.model !== "openai") {
        console.log(`[Aether] Fallback to openai`);
        const fbParams = new URLSearchParams({ model: "openai", system: systemPrompt });
        const fbUrl = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?${fbParams}`;
        const fbRes = await fetch(fbUrl);
        if (fbRes.ok) {
          const fbText = await fbRes.text();
          if (fbText && fbText.trim().length > 0) return NextResponse.json({ content: fbText });
        }
      }
      return NextResponse.json({ error: "AI is busy. Try again." }, { status: 502 });
    }

    const text = await res.text();
    console.log(`[Aether] Response (first 80):`, text.slice(0, 80));

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Empty response. Try again." }, { status: 502 });
    }

    return NextResponse.json({ content: text });
  } catch (e: any) {
    if (e?.name === "AbortError") return NextResponse.json({ error: "Timed out — try Swift mode" }, { status: 504 });
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}