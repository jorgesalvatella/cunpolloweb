import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
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

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Solo se permiten imagenes" }, { status: 400 });
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Imagen muy grande (max 5MB)" }, { status: 400 });
  }

  // Generate clean filename
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const slug = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `menu/${slug}-${Date.now()}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return NextResponse.json({ url: blob.url });
}
