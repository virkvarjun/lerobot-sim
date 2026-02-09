/**
 * Composes a side-by-side comparison image.
 * Left: design/ui_reference.png   Right: design/current_render.png
 * Output: design/side_by_side.png
 *
 * Usage: node scripts/side-by-side.mjs
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const designDir = path.resolve(__dirname, "../../design");

async function main() {
  const refPath = path.join(designDir, "ui_reference.png");
  const curPath = path.join(designDir, "current_render.png");
  const outPath = path.join(designDir, "side_by_side.png");

  // Read both images
  const refMeta = await sharp(refPath).metadata();
  const curMeta = await sharp(curPath).metadata();

  // Normalise heights
  const targetH = Math.max(refMeta.height, curMeta.height);

  const refBuf = await sharp(refPath)
    .resize({ height: targetH, fit: "contain", background: { r: 200, g: 200, b: 200, alpha: 1 } })
    .toBuffer();
  const curBuf = await sharp(curPath)
    .resize({ height: targetH, fit: "contain", background: { r: 200, g: 200, b: 200, alpha: 1 } })
    .toBuffer();

  const refResized = await sharp(refBuf).metadata();
  const curResized = await sharp(curBuf).metadata();

  const gap = 20;
  const totalW = refResized.width + curResized.width + gap;

  await sharp({
    create: {
      width: totalW,
      height: targetH,
      channels: 3,
      background: { r: 180, g: 180, b: 180 },
    },
  })
    .composite([
      { input: refBuf, left: 0, top: 0 },
      { input: curBuf, left: refResized.width + gap, top: 0 },
    ])
    .png()
    .toFile(outPath);

  console.log(`Side-by-side saved to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
