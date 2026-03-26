import { NextRequest, NextResponse } from "next/server";
import { getNextRef } from "@/lib/refs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as "quote" | "invoice" | "signoff";

  if (!["quote", "invoice", "signoff"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const ref = await getNextRef(type);
  return NextResponse.json({ ref });
}
