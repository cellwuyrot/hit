import { readdir, readFile, writeFile, mkdir, copyFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const WATERMARK_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function createWatermarkSvg(width: number, height: number): Buffer {
  const text = "TH";
  const bigSize = Math.round(Math.min(width, height) / 3);
  const smallSize = Math.round(Math.min(width, height) / 8);
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);

  const smallPositions: { x: number; y: number }[] = [];
  const spacingX = Math.round(width / 3);
  const spacingY = Math.round(height / 3);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let px = col * spacingX + Math.round(spacingX / 2);
      const py = row * spacingY + Math.round(spacingY / 2);
      if (row % 2 === 1) px += Math.round(spacingX / 2);
      if (px > 0 && px < width && py > 0 && py < height) {
        const distFromCenter = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
        if (distFromCenter > bigSize * 0.8) {
          smallPositions.push({ x: px, y: py });
        }
      }
    }
  }

  const smallTexts = smallPositions
    .map(
      (p) =>
        `<text x="${p.x}" y="${p.y}" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="${smallSize}" fill="rgba(128,128,128,0.15)" text-anchor="middle" dominant-baseline="central">${text}</text>`
    )
    .join("\n    ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <text x="${cx}" y="${cy}" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="${bigSize}" fill="rgba(128,128,128,0.18)" text-anchor="middle" dominant-baseline="central">${text}</text>
    <text x="${cx + 2}" y="${cy + 2}" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="${bigSize}" fill="rgba(255,255,255,0.12)" text-anchor="middle" dominant-baseline="central">${text}</text>
    ${smallTexts}
  </svg>`;

  return Buffer.from(svg);
}

async function main() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const backupDir = path.join(process.cwd(), "public", "uploads-original");

  let files: string[];
  try {
    files = await readdir(uploadsDir);
  } catch {
    console.log("No uploads directory found.");
    return;
  }

  const imageFiles = files.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return WATERMARK_EXTENSIONS.includes(ext);
  });

  if (imageFiles.length === 0) {
    console.log("No image files found in uploads/");
    return;
  }

  console.log(`Found ${imageFiles.length} images. Applying watermarks...`);

  await mkdir(backupDir, { recursive: true });

  let processed = 0;
  let errors = 0;

  for (const file of imageFiles) {
    try {
      const filePath = path.join(uploadsDir, file);
      const backupPath = path.join(backupDir, file);

      await copyFile(filePath, backupPath);

      const buffer = await readFile(filePath);
      const metadata = await sharp(buffer).metadata();
      const width = metadata.width || 800;
      const height = metadata.height || 800;

      const watermarkSvg = createWatermarkSvg(width, height);

      const result = await sharp(buffer)
        .composite([{ input: watermarkSvg, top: 0, left: 0 }])
        .toBuffer();

      await writeFile(filePath, result);
      processed++;
      if (processed % 50 === 0) {
        console.log(`  Processed ${processed}/${imageFiles.length}...`);
      }
    } catch (err) {
      console.error(`  Error processing ${file}:`, err);
      errors++;
    }
  }

  console.log(`\nDone! Processed: ${processed}, Errors: ${errors}`);
  console.log(`Original files backed up to: public/uploads-original/`);
}

main();
