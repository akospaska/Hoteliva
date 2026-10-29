import ts from 'typescript';

// Resolve the declaration that owns a function, excluding one-off inline callbacks.
export function facadeDocumentationTarget(node) {
  if (
    (ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node)) &&
    node.body
  )
    return node;
  if (!ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) return undefined;
  let parent = node.parent;
  while (
    parent &&
    (ts.isParenthesizedExpression(parent) ||
      ts.isAsExpression(parent) ||
      ts.isSatisfiesExpression(parent) ||
      ts.isTypeAssertionExpression(parent) ||
      ts.isNonNullExpression(parent))
  )
    parent = parent.parent;
  if (ts.isVariableDeclaration(parent)) {
    const statement = parent.parent.parent;
    return ts.isVariableStatement(statement) && parent.parent.declarations.length === 1
      ? statement
      : parent;
  }
  if (
    ts.isPropertyAssignment(parent) ||
    ts.isReturnStatement(parent) ||
    ts.isExportAssignment(parent)
  )
    return parent;
  if (ts.isArrowFunction(parent)) return node;
  return ts.isFunctionExpression(node) && node.name ? node : undefined;
}

// Check syntax and placement only; reviewers must verify English and business accuracy.
export function facadeCommentFailures(ast) {
  const source = ast.text;
  const failures = [];
  function visit(node) {
    const target = facadeDocumentationTarget(node);
    if (target) {
      const comments = ts.getLeadingCommentRanges(source, target.getFullStart()) || [];
      const last = comments.at(-1);
      const raw = last ? source.slice(last.pos, last.end) : '';
      const description = raw
        .replace(/^\/\*\*|\*\/$/g, '')
        .split('\n')
        .map((line) => line.replace(/^\s*\* ?/, '').trim())
        .join('\n')
        .split(/(?:^|\n)\s*@/)[0]
        .trim();
      if (
        !raw.startsWith('/**') ||
        !last ||
        source.slice(last.end, target.getStart(ast)).trim() ||
        (description.match(/[A-Za-z]+/g) || []).length < 3
      ) {
        const { line } = ast.getLineAndCharacterOfPosition(target.getStart(ast));
        failures.push(
          `${ast.fileName}:${line + 1}: facade function needs a descriptive JSDoc immediately above its declaration`,
        );
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return failures;
}
