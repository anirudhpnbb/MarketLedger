// GitHub Pages project sites serve from https://<user>.github.io/<repo>/, not
// domain root, but `expo export --platform web` emits root-relative asset
// paths (src="/_expo/...", href="/favicon.ico"). Rewrite them to relative
// paths so the exported dist/ works from any subpath.
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const indexPath = join(process.cwd(), 'dist', 'index.html');
const html = readFileSync(indexPath, 'utf8');
const fixed = html.replace(/(src|href)="\//g, '$1="./');
writeFileSync(indexPath, fixed);
console.log(`Rewrote root-relative paths in ${indexPath}`);
