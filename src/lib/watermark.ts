import sharp from "sharp";

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

export async function addWatermark(inputBuffer: Uint8Array): Promise<Uint8Array> {
  const metadata = await sharp(inputBuffer).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 800;

  const watermarkSvg = createWatermarkSvg(width, height);

  const result = await sharp(inputBuffer)
    .composite([
      {
        input: watermarkSvg,
        top: 0,
        left: 0,
      },
    ])
    .toBuffer();

  return result as Uint8Array;
}

export function isImageFile(ext: string): boolean {
  return [".jpg", ".jpeg", ".png", ".webp"].includes(ext.toLowerCase());
}
