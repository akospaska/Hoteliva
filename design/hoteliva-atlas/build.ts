import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = resolve(base, '../..');
const out = resolve(base, 'dist');
mkdirSync(out, { recursive: true });
const index = readFileSync(resolve(root, 'docs/features/README.md'), 'utf8');
const docs = ['mvp.md', 'extensions.md'].map((name) =>
  readFileSync(resolve(root, 'docs/features', name), 'utf8'),
);
const sections = docs.flatMap((doc) =>
  [...doc.matchAll(/^## (F\d+) – (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map((match) => {
    const [, id, title, body] = match;
    const row = index.split('\n').find((line) => line.includes(`| ${id}`)) || '';
    const status = row.split('|')[3]?.trim() || 'Kell, ütemezendő';
    return {
      id,
      title,
      status,
      requirements: [...body.matchAll(/^- (.+(?:\n(?!\n|[-#]).+)*)/gm)].map((m) =>
        m[1].replace(/\n/g, ' ').replace(/\*\*/g, ''),
      ),
      notes: body
        .split('\n\n')
        .filter((p) => p.trim() && !p.startsWith('-') && !p.startsWith('Besorolás:'))
        .map((p) => p.replace(/\n/g, ' ').trim()),
    };
  }),
);
if (sections.length !== 30) throw new Error(`Expected 30 features, got ${sections.length}`);
const generated = '// Generated from docs/features. Do not edit.\n';
writeFileSync(
  resolve(out, 'data.js'),
  generated + `const featureData = ${JSON.stringify(sections)};\n`,
);
for (const name of ['specs', 'screen', 'atlas']) {
  const source = readFileSync(resolve(base, 'src', `${name}.ts`), 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  });
  writeFileSync(resolve(out, `${name}.js`), generated + result.outputText);
}
for (const name of [
  'index.html',
  'fonts.css',
  'screen.html',
  'atlas.css',
  'atlas-overview.css',
  'atlas-content.css',
  'atlas-responsive.css',
  'screen.css',
  'screen-components.css',
  'screen-detail.css',
  'screen-mobile.css',
]) {
  copyFileSync(resolve(base, 'src', name), resolve(out, name));
}
console.log(`Built atlas with ${sections.length} feature specifications.`);
