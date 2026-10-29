import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile } from 'node:fs/promises';
const svg = await readFile('apps/client/assets/brand.svg', 'utf8');
for (const [size, file] of [
  [1024, 'apps/client/assets/icon.png'],
  [192, 'apps/client/public/icon-192.png'],
  [512, 'apps/client/public/icon-512.png'],
]) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  await writeFile(file, png);
}
