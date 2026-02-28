import { put } from "@vercel/blob";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

async function uploadMenuImages() {
  const menuDir = join(process.cwd(), "public/images/menu");
  const files = readdirSync(menuDir).filter((f) => f.endsWith(".webp"));

  console.log(`Found ${files.length} images to upload...\n`);

  const mapping: Record<string, string> = {};

  for (const filename of files) {
    const filePath = join(menuDir, filename);
    const fileBuffer = readFileSync(filePath);

    const { url } = await put(`menu/${filename}`, fileBuffer, {
      access: "public",
      contentType: "image/webp",
    });

    mapping[filename] = url;
    console.log(`  ${filename} -> ${url}`);
  }

  console.log("\n--- JSON mapping ---\n");
  console.log(JSON.stringify(mapping, null, 2));
}

uploadMenuImages().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
