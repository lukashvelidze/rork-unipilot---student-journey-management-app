import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptsDirectory, "..");
const outputDirectory = resolve(projectDirectory, "assets/onboarding");
const outputPath = resolve(outputDirectory, "animated-globe.html");
const result = await build({
  bundle: true,
  entryPoints: [resolve(scriptsDirectory, "globe-canvas.js")],
  format: "iife",
  minify: true,
  platform: "browser",
  target: ["safari15", "chrome100"],
  write: false,
});
const script = result.outputFiles[0].text.replaceAll("</script", "<\\/script");
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;overflow:hidden;background:transparent}body{display:flex;align-items:center;justify-content:center}canvas{display:block}</style></head><body><canvas aria-hidden="true"></canvas><script>${script}</script></body></html>`;

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, html);
console.log(`Generated ${outputPath}`);
