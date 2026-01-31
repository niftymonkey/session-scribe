#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/bump-version.mjs <version>');
  console.error('Example: node scripts/bump-version.mjs 1.0.0');
  process.exit(1);
}

// Validate semver format
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Error: Version must be in semver format (e.g., 1.0.0)');
  process.exit(1);
}

// Update package.json
const pkgPath = 'package.json';
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Updated ${pkgPath} to ${version}`);

// Update tauri.conf.json
const tauriPath = 'src-tauri/tauri.conf.json';
const tauri = JSON.parse(readFileSync(tauriPath, 'utf-8'));
tauri.version = version;
writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + '\n');
console.log(`Updated ${tauriPath} to ${version}`);

// Git operations
execSync(`git add ${pkgPath} ${tauriPath}`);
execSync(`git commit -m "chore: bump version to ${version}"`);
execSync(`git tag v${version}`);
console.log(`\nCreated commit and tag v${version}`);
console.log(`\nTo release, run: git push && git push --tags`);
