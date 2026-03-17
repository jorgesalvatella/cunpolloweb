import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { verifyAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se envio archivo" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Solo se permiten imagenes" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Imagen muy grande (max 10MB)" }, { status: 400 });
  }

  // Optimize: resize to 800px max, convert to WebP, quality 80
  const buffer = Buffer.from(await file.arrayBuffer());
  const optimized = await sharp(buffer)
    .resize(1620, 1080, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  // Generate clean filename
  const slug = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `menu/${slug}-${Date.now()}.webp`;

  const blob = await put(filename, optimized, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/webp",
  });

  return NextResponse.json({
    url: blob.url,
    originalSize: file.size,
    optimizedSize: optimized.length,
  });
}
