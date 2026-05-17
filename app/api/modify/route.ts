import { NextRequest, NextResponse } from "next/server";

const HF_TOKEN = () => process.env.HF_TOKEN || "";
const GROQ_KEY = () => process.env.GROQ_API_KEY || "";
const TOGETHER_KEY = () => process.env.TOGETHER_API_KEY || "";

// ── Strategy 1: HuggingFace instruct-pix2pix (TRUE img2img) ──
async function hfPix2Pix(imageBase64: string, prompt: string): Promise<string | null> {
  if (!HF_TOKEN()) return null;
  try {
    // Convert base64 to binary
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Send image as binary with prompt in parameters
    const res = await fetch("https://router.huggingface.co/hf-inference/models/timbrooks/instruct-pix2pix", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN()}`,
        "Content-Type": "application/octet-stream",
        "X-Wait-For-Model": "true",
      },
      body: imageBuffer,
    });

    console.log(`[Aether] HF pix2pix status: ${res.status}`);
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.log(`[Aether] HF pix2pix error: ${err.slice(0, 200)}`);

      // Try JSON format instead
      return await hfPix2PixJson(imageBase64, prompt);
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.startsWith("image/")) {
      const buf = await res.arrayBuffer();
      console.log(`[Aether] HF pix2pix success (${buf.byteLength} bytes)`);
      return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
    }
    return null;
  } catch (e: any) { console.log(`[Aether] HF pix2pix error: ${e?.message}`); return null; }
}

// Alternative JSON format for HF
async function hfPix2PixJson(imageBase64: string, prompt: string): Promise<string | null> {
  if (!HF_TOKEN()) return null;
  try {
    const res = await fetch("https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN()}`,
        "Content-Type": "application/json",
        "x-wait-for-model": "true",
      },
      body: JSON.stringify({
        inputs: imageBase64,
        parameters: {
          prompt,
          num_inference_steps: 25,
          image_guidance_scale: 1.5,
          guidance_scale: 7.5,
        },
      }),
    });

    console.log(`[Aether] HF pix2pix-json status: ${res.status}`);
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.log(`[Aether] HF pix2pix-json error: ${err.slice(0, 200)}`);
      return null;
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.startsWith("image/")) {
      const buf = await res.arrayBuffer();
      console.log(`[Aether] HF pix2pix-json success (${buf.byteLength} bytes)`);
      return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
    }
    // Try parsing as JSON with base64
    const data = await res.json().catch(() => null);
    if (data?.[0]?.blob) return `data:image/png;base64,${data[0].blob}`;
    return null;
  } catch (e: any) { console.log(`[Aether] HF json error: ${e?.message}`); return null; }
}

// ── Strategy 2: HuggingFace SDXL Refiner ──
async function hfSdxlRefine(imageBase64: string, prompt: string): Promise<string | null> {
  if (!HF_TOKEN()) return null;
  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    const res = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-refiner-1.0", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN()}`,
        "Content-Type": "application/octet-stream",
        "x-wait-for-model": "true",
      },
      body: imageBuffer,
    });

    console.log(`[Aether] HF SDXL refiner status: ${res.status}`);
    if (!res.ok) return null;

    const ct = res.headers.get("content-type") || "";
    if (ct.startsWith("image/")) {
      const buf = await res.arrayBuffer();
      return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
    }
    return null;
  } catch (e: any) { console.log(`[Aether] HF SDXL error: ${e?.message}`); return null; }
}

// ── Strategy 3: Groq describe + Together generate (fallback) ──
async function describeAndGenerate(imageBase64: string, prompt: string): Promise<string | null> {
  if (!GROQ_KEY()) return null;
  try {
    const descRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY()}` },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: [
          { type: "image_url", image_url: { url: imageBase64 } },
          { type: "text", text: "Describe this image in extreme detail for an AI image generator. Include exact appearance: age, gender, ethnicity, hair color/style, facial hair, glasses, clothing details, colors, pose, expression, background, lighting. Be hyper-specific." }
        ]}],
        temperature: 0.2, max_tokens: 400,
      }),
    });
    if (!descRes.ok) { console.log(`[Aether] Groq vision status: ${descRes.status}`); return null; }
    const descData = await descRes.json();
    const description = descData?.choices?.[0]?.message?.content;
    if (!description) return null;
    console.log(`[Aether] Described: ${description.slice(0, 100)}...`);

    const fullPrompt = `${description}. IMPORTANT MODIFICATION: ${prompt}. Keep the EXACT same person, face, body type, and background. Only change what was requested.`;

    if (TOGETHER_KEY()) {
      const genRes = await fetch("https://api.together.xyz/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOGETHER_KEY()}` },
        body: JSON.stringify({ model: "black-forest-labs/FLUX.1-schnell-Free", prompt: fullPrompt, width: 768, height: 768, n: 1 }),
      });
      if (genRes.ok) {
        const d = await genRes.json();
        const b64 = d?.data?.[0]?.b64_json;
        if (b64) return `data:image/png;base64,${b64}`;
        const url = d?.data?.[0]?.url;
        if (url) { const r = await fetch(url); if (r.ok) { const buf = await r.arrayBuffer(); return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`; } }
      }
    }
    return null;
  } catch (e: any) { console.log(`[Aether] Describe+Gen error: ${e?.message}`); return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { action, prompt, style, imageBase64 } = await req.json();

    if (!imageBase64) return NextResponse.json({ error: "Upload an image first." }, { status: 400 });

    const instruction = action === "style-transfer"
      ? ({
          anime: "Convert to anime style, cel-shaded, vibrant colors",
          painting: "Convert to oil painting, visible brushstrokes, impressionist",
          watercolor: "Convert to watercolor painting, soft washes, paper texture",
          sketch: "Convert to pencil sketch, detailed line drawing, graphite",
          "3d": "Convert to 3D rendered style, Pixar-like, ray traced",
          cyberpunk: "Make cyberpunk style with neon lights and futuristic elements",
          vintage: "Make look like vintage 1970s photograph with film grain",
          pop_art: "Convert to pop art style with bold colors and halftone dots",
        }[style] || `Convert to ${style} style`)
      : prompt;

    console.log(`[Aether] ${action}: "${instruction?.slice(0, 60)}..."`);

    // Strategy 1: Real img2img with instruct-pix2pix
    console.log(`[Aether] Trying HF instruct-pix2pix...`);
    const pix2pixResult = await hfPix2Pix(imageBase64, instruction);
    if (pix2pixResult) return NextResponse.json({ url: pix2pixResult });

    // Strategy 2: SDXL Refiner
    console.log(`[Aether] Trying HF SDXL refiner...`);
    const sdxlResult = await hfSdxlRefine(imageBase64, instruction);
    if (sdxlResult) return NextResponse.json({ url: sdxlResult });

    // Strategy 3: Describe + Generate (last resort)
    console.log(`[Aether] Trying describe+generate fallback...`);
    const fallbackResult = await describeAndGenerate(imageBase64, instruction);
    if (fallbackResult) return NextResponse.json({ url: fallbackResult });

    return NextResponse.json({
      error: "Image modification models are loading. Wait 30 seconds and try again — first request wakes them up.",
    }, { status: 502 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}