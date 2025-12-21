import { promises as fs } from 'node:fs';
import path from 'node:path';

const CSS_PATH = path.join(process.cwd(), 'styles.css');

async function minify() {
    let css = await fs.readFile(CSS_PATH, 'utf8');

    // Remove comments
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // Collapse whitespace
    css = css.replace(/\s+/g, ' ');

    // Remove space around delimiters
    css = css.replace(/\s*([{}:;,])\s*/g, '$1');

    // Fix semi-colons
    css = css.replace(/;}/g, '}');

    await fs.writeFile(CSS_PATH, css);
    console.log('CSS Minified:', CSS_PATH);
}

minify().catch(console.error);
