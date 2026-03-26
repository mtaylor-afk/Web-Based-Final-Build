import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  prompt: z.string().min(1),
  type: z.enum(["inspiration_board", "visualisation"]),
  address: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { prompt, type, address } = parsed.data;

  // Stub response when no API key
  if (!process.env.OPENAI_API_KEY) {
    // Return a placeholder image URL (local SVG placeholder)
    return NextResponse.json({
      imageUrl: "/placeholder-visual.svg",
      note: "AI image generation running in stub mode — add OPENAI_API_KEY to .env for live generation.",
    });
  }

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const typeLabel = type === "inspiration_board" ? "inspiration mood board" : "architectural visualisation";
    const fullPrompt = `Professional construction and interior design ${typeLabel}. ${prompt}${address ? ` for a property at ${address}` : ""}. High quality, realistic, professional presentation style.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data?.[0]?.url || "";
    return NextResponse.json({ imageUrl });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Image generation failed" }, { status: 500 });
  }
}
