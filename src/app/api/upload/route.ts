import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Supported types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];
const MAX_SIZE_MB = 10;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const parentType = formData.get("parentType") as string | null;
  const parentId = formData.get("parentId") as string | null;

  if (!file || !parentType || !parentId) {
    return NextResponse.json({ error: "Missing required fields: file, parentType, parentId" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed. Use JPEG, PNG, WebP or GIF." }, { status: 400 });
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `File too large. Maximum size is ${MAX_SIZE_MB}MB.` }, { status: 400 });
  }

  // Create upload directory
  const uploadDir = path.join(process.cwd(), "public", "uploads", parentType, parentId);
  await mkdir(uploadDir, { recursive: true });

  // Write file
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(uploadDir, safeName);
  await writeFile(filePath, buffer);

  const fileUrl = `/uploads/${parentType}/${parentId}/${safeName}`;

  // Persist to the correct attachment table and update hasImages flag
  let attachment;
  if (parentType === "quote") {
    attachment = await prisma.quoteAttachment.create({
      data: {
        quoteId: parentId,
        fileName: file.name,
        mimeType: file.type,
        fileUrl,
        fileSize: file.size,
      },
    });
    await prisma.quote.update({ where: { id: parentId }, data: { hasImages: true } });
  } else if (parentType === "invoice") {
    attachment = await prisma.invoiceAttachment.create({
      data: {
        invoiceId: parentId,
        fileName: file.name,
        mimeType: file.type,
        fileUrl,
        fileSize: file.size,
      },
    });
    await prisma.invoice.update({ where: { id: parentId }, data: { hasImages: true } });
  } else if (parentType === "signoff") {
    attachment = await prisma.signOffAttachment.create({
      data: {
        signOffId: parentId,
        fileName: file.name,
        mimeType: file.type,
        fileUrl,
        fileSize: file.size,
      },
    });
    await prisma.projectSignOff.update({ where: { id: parentId }, data: { hasImages: true } });
  } else {
    return NextResponse.json({ error: "Unknown parentType" }, { status: 400 });
  }

  return NextResponse.json({ attachment, fileUrl }, { status: 201 });
}

// Delete an attachment
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const parentType = searchParams.get("parentType");
  const parentId = searchParams.get("parentId");

  if (!id || !parentType || !parentId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  if (parentType === "quote") {
    await prisma.quoteAttachment.delete({ where: { id } });
    const remaining = await prisma.quoteAttachment.count({ where: { quoteId: parentId } });
    await prisma.quote.update({ where: { id: parentId }, data: { hasImages: remaining > 0 } });
  } else if (parentType === "invoice") {
    await prisma.invoiceAttachment.delete({ where: { id } });
    const remaining = await prisma.invoiceAttachment.count({ where: { invoiceId: parentId } });
    await prisma.invoice.update({ where: { id: parentId }, data: { hasImages: remaining > 0 } });
  } else if (parentType === "signoff") {
    await prisma.signOffAttachment.delete({ where: { id } });
    const remaining = await prisma.signOffAttachment.count({ where: { signOffId: parentId } });
    await prisma.projectSignOff.update({ where: { id: parentId }, data: { hasImages: remaining > 0 } });
  }

  return NextResponse.json({ success: true });
}
