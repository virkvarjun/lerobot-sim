/**
 * Takes a full-page screenshot of the running dev server.
 * Usage: node scripts/screenshot.mjs
 */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, "../../design/current_render.png");

async function main() {
  const browser = await chromium.launch({
    headless: false,          // headed mode for WebGL support
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
    ],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on("pageerror", (err) => console.error("[browser error]", err.message));

  await page.goto("http://localhost:5173", { waitUntil: "load" });
  // Wait for React + Three.js + WS data
  await page.waitForTimeout(5000);

  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`Screenshot saved to ${outPath}`);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
