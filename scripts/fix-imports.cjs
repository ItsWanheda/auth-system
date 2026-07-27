/* eslint-disable */
/**
 * One-shot script: rewrites every `from '@/...'` import in src/ to a
 * relative path. This makes the project work without tsconfig-paths
 * runtime registration, which is brittle across tsx / Node versions
 * (especially on Windows).
 *
 * Usage:  node scripts/fix-imports.cjs
 * Re-run safely: it only changes files that still contain "@/" imports.
 */
const fs = require('node:fs');
const path = require('node:path');

const SRC_DIR = path.resolve(__dirname, '..', 'src');

function toRelative(fromFile, aliased) {
  // aliased is like '@/foo/bar'
  const clean = aliased.replace(/^@\//, '');
  const absolute = path.join(SRC_DIR, clean);
  let rel = path.relative(path.dirname(fromFile), absolute).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const updated = original.replace(
    /(\bfrom\s+['"])@\/([^'"]+)(['"])/g,
    (_, prefix, imp, suffix) => `${prefix}${toRelative(filePath, '@/'.concat(imp))}${suffix}`,
  );
  if (updated !== original) {
    fs.writeFileSync(filePath, updated);
    console.log('  fixed  ' + path.relative(process.cwd(), filePath));
    return 1;
  }
  return 0;
}

function walk(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) count += walk(p);
    else if (entry.isFile() && p.endsWith('.ts')) count += processFile(p);
  }
  return count;
}

console.log('Rewriting @/ imports to relative paths in src/...\n');
const total = walk(SRC_DIR);
console.log(`\nDone. ${total} file(s) updated.`);
console.log('Now restart:  npm run dev\n');