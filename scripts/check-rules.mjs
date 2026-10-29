import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { facadeCommentFailures } from './facade-comments.mjs';

const ignored = new Set([
  'node_modules',
  '.git',
  '.expo',
  'dist',
  'dist-android',
  'android',
  'ios',
  'coverage',
  'test-results',
  'playwright-report',
]);
const textExtensions = /\.(?:[cm]?[jt]sx?|json|md|ya?ml|html|css|tf|txt)$/;
const failures = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(file);
      continue;
    }
    if (
      !textExtensions.test(entry.name) ||
      entry.name === 'package-lock.json' ||
      entry.name === 'expo-env.d.ts'
    )
      continue;
    const source = await readFile(file, 'utf8');
    if (source.trimEnd().split('\n').length > 500) failures.push(`${file}: exceeds 500 lines`);
    if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const layer = /\/src\/(controllers|facades|dals)\//.exec(file)?.[1];
    if (layer === 'facades') failures.push(...facadeCommentFailures(ast));
    function visit(node) {
      if (ts.isClassDeclaration(node) || ts.isClassExpression(node))
        failures.push(`${file}: class forbidden`);
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const imported = node.moduleSpecifier.text;
        if (layer === 'controllers' && /(?:dals|mongodb|adapters)/.test(imported))
          failures.push(`${file}: controller bypasses facade`);
        if (layer === 'facades' && /^(express|mongodb)$|controllers/.test(imported))
          failures.push(`${file}: facade crosses layer boundary`);
        if (layer === 'dals' && /(?:facades|controllers|adapters)|^express$/.test(imported))
          failures.push(`${file}: DAL crosses layer boundary`);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
}
await walk('.');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log('File length, class prohibition, layer imports and facade JSDoc: OK');
