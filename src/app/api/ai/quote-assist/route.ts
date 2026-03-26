import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  rawNotes: z.string().min(1),
  clientContext: z.string().optional(),
  ratesContext: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { rawNotes, clientContext, ratesContext } = parsed.data;

  // If no API key, return a stub response for local dev
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      wording: `Supply and installation of works as specified: ${rawNotes}. All works to be carried out to a high standard in accordance with current building regulations and best trade practice. Materials and workmanship to be approved by the client prior to commencement.`,
      note: "AI assist running in stub mode — add OPENAI_API_KEY to .env for live AI wording.",
    });
  }

  try {
    const systemPrompt = `You are a professional quantity surveyor and construction estimator for WV Construction (ACOR Building and Property Solutions Ltd).
Your task is to expand rough site notes into clear, professional quote wording suitable for customer-facing construction quotations.
Keep descriptions concise but specific. Use builder-standard terminology. Output in plain text, not markdown.
${ratesContext ? `\nAvailable rates context:\n${ratesContext}` : ""}
${clientContext ? `\nClient context:\n${clientContext}` : ""}`;

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Expand these rough notes into professional quote wording:\n\n${rawNotes}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.4,
    });

    const wording = completion.choices[0].message.content?.trim() || "";
    return NextResponse.json({ wording });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "AI service error" }, { status: 500 });
  }
}
