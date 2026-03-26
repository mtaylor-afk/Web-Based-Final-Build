import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Supported types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];
const MAX_SIZE_MB = 10;

async function storeFile(file: File, parentType: string, parentId: string): Promise<string> {
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Vercel Blob — production
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${parentType}/${parentId}/${safeName}`, buffer, {
      access: "public",
      contentType: file.type,
    });
    return blob.url;
  }

  // Local filesystem — development
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");
  const uploadDir = path.join(process.cwd(), "public", "uploads", parentType, parentId);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeName), buffer);
  return `/uploads/${parentType}/${parentId}/${safeName}`;
}

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

  const fileUrl = await storeFile(file, parentType, parentId);

  let attachment;
  if (parentType === "quote") {
    attachment = await prisma.quoteAttachment.create({
      data: { quoteId: parentId, fileName: file.name, mimeType: file.type, fileUrl, fileSize: file.size },
    });
    await prisma.quote.update({ where: { id: parentId }, data: { hasImages: true } });
  } else if (parentType === "invoice") {
    attachment = await prisma.invoiceAttachment.create({
      data: { invoiceId: parentId, fileName: file.name, mimeType: file.type, fileUrl, fileSize: file.size },
    });
    await prisma.invoice.update({ where: { id: parentId }, data: { hasImages: true } });
  } else if (parentType === "signoff") {
    attachment = await prisma.signOffAttachment.create({
      data: { signOffId: parentId, fileName: file.name, mimeType: file.type, fileUrl, fileSize: file.size },
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
