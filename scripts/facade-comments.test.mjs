import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { facadeCommentFailures } from './facade-comments.mjs';

const check = (source) =>
  facadeCommentFailures(
    ts.createSourceFile('apps/server/src/facades/example.ts', source, ts.ScriptTarget.Latest, true),
  );

test('facade declarations, methods and assigned functions require descriptions', () => {
  for (const declaration of [
    'export function create() {}',
    'const create = () => {};',
    'const create = function () {};',
    'const create = (() => {}) satisfies (() => void);',
    'const api = { save() {} };',
    'const api = { save: () => {} };',
    'const api = { get value() { return 1; } };',
    'export default () => {};',
  ])
    assert.equal(check(declaration).length, 1, declaration);
});

test('a description must be directly above its owning declaration', () => {
  assert.equal(
    check('/** Creates an authorized record. */\nexport function create() {}').length,
    0,
  );
  assert.equal(check('const api = {\n/** Saves an authorized record. */\nsave() {}\n};').length, 0);
  assert.equal(check('/** Saves an authorized record. */\nconst save = () => {};').length, 0);
  assert.equal(
    check('/** Saves an authorized record. */\nconst unrelated = 1;\nfunction save() {}').length,
    1,
  );
  assert.equal(check('function save() { /** Saves an authorized record. */ }').length, 1);
  assert.equal(check('// Saves an authorized record.\nfunction save() {}').length, 1);
});

test('empty, tag-only and name-only comments cannot satisfy the facade rule', () => {
  for (const doc of ['/** */', '/** @returns The saved record. */', '/** create */'])
    assert.equal(check(`${doc}\nfunction create() {}`).length, 1);
});

test('factory documentation does not cover returned functions or named helpers', () => {
  const factory = '/** Builds the authorized workflow. */\nfunction factory()';
  assert.equal(check(`${factory} { return async () => {}; }`).length, 1);
  assert.equal(
    check(`${factory} {\n/** Saves an authorized record. */\nreturn async () => {}; }`).length,
    0,
  );
  assert.equal(check(`${factory} { const validate = () => {}; }`).length, 1);
  assert.equal(check(`${factory} { return { save() {} }; }`).length, 1);
  assert.equal(
    check('/** Builds the authorized workflow. */\nconst factory = () => () => {};').length,
    1,
  );
  assert.equal(
    check(
      '/** Builds the authorized workflow. */\nconst factory = () =>\n/** Saves an authorized record. */\n() => {};',
    ).length,
    0,
  );
  assert.ok(
    check('/** Saves an authorized record. */\nconst first = () => {}, second = () => {};').length >
      0,
  );
});

test('inline callbacks and signatures without implementations are exempt', () => {
  assert.equal(
    check('items.map((item) => item.id).filter(function (id) { return !!id; });').length,
    0,
  );
  assert.equal(check('type Work = () => void; interface Api { save(): void; }').length, 0);
});
