import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, 'assets');
const OUTPUT_DIR = path.join(ASSETS_DIR, 'generated');
const DATA_DIR = path.join(ROOT, '_data');
const MANIFEST_PATH = path.join(DATA_DIR, 'image-manifest.json');

const TARGET_WIDTHS = [200, 360, 540, 640, 720, 960, 1080, 1280];
const PORTFOLIO_SOURCES = [
  'portfolio1.jpg',
  'portfolio2.jpg',
  'portfolio3.jpg',
  'portfolio4.jpg',
  'portfolio5.jpg',
  'portfolio6.jpg',
  'portfolio7.jpg',
  'portfolio8.jpg',
  'portfolio9.jpg',
  'portfolio10.jpg',
  'portfolio11.jpg',
  'portfolio12.jpg',
  'portfolio13.jpg'];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function generateVariants(filename) {
  const id = path.parse(filename).name;
  const inputPath = path.join(ASSETS_DIR, filename);
  const outputSubdir = path.join(OUTPUT_DIR, id);
  await ensureDir(outputSubdir);

  const image = sharp(inputPath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Unable to read dimensions for ${filename}`);
  }

  const placeholderBuffer = await sharp(inputPath)
    .resize({ width: 24, withoutEnlargement: true })
    .webp({ quality: 28 })
    .toBuffer();

  const entry = {
    width: metadata.width,
    height: metadata.height,
    fallback: `/assets/${filename}`,
    placeholder: `data:image/webp;base64,${placeholderBuffer.toString('base64')}`,
    sources: {
      avif: [],
      webp: []
    }
  };

  const widthSet = new Set(TARGET_WIDTHS.filter(w => w < metadata.width));
  widthSet.add(Math.min(metadata.width, TARGET_WIDTHS[TARGET_WIDTHS.length - 1]));
  const widths = Array.from(widthSet).sort((a, b) => a - b);

  for (const targetWidth of widths) {
    const actualWidth = Math.min(targetWidth, metadata.width);
    const fileBase = `${id}-${actualWidth}`;

    const avifPath = path.join(outputSubdir, `${fileBase}.avif`);
    const webpPath = path.join(outputSubdir, `${fileBase}.webp`);

    await sharp(inputPath)
      .resize({ width: actualWidth, withoutEnlargement: true })
      .avif({ quality: 50, chromaSubsampling: '4:2:0' })
      .toFile(avifPath);

    await sharp(inputPath)
      .resize({ width: actualWidth, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(webpPath);

    entry.sources.avif.push({ width: actualWidth, path: `/assets/generated/${id}/${fileBase}.avif` });
    entry.sources.webp.push({ width: actualWidth, path: `/assets/generated/${id}/${fileBase}.webp` });
  }

  entry.sources.avif.sort((a, b) => a.width - b.width);
  entry.sources.webp.sort((a, b) => a.width - b.width);

  return [id, entry];
}

async function buildManifest() {
  await ensureDir(OUTPUT_DIR);
  await ensureDir(DATA_DIR);

  const entries = await Promise.all(PORTFOLIO_SOURCES.map(generateVariants));
  const manifest = Object.fromEntries(entries);

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log(`Generated responsive sources for ${entries.length} images.`);

  // Generate Logo variants
  console.log('Generating logo variants...');
  const logoInputParams = {
    filename: 'logo.png',
    widths: [200, 320, 480, 640], // Custom widths for logo
    targetDir: path.join(ASSETS_DIR, 'generated', 'logo')
  };

  await ensureDir(logoInputParams.targetDir);
  const logoInputPath = path.join(ASSETS_DIR, logoInputParams.filename);

  for (const w of logoInputParams.widths) {
    await sharp(logoInputPath)
      .resize({ width: w })
      .toFile(path.join(logoInputParams.targetDir, `logo-${w}.png`));

    // Also generate WebP for logo
    await sharp(logoInputPath)
      .resize({ width: w })
      .webp()
      .toFile(path.join(logoInputParams.targetDir, `logo-${w}.webp`));
  }
  console.log('Logo variants generated.');
}

buildManifest().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
