#!/usr/bin/env node
/**
 * Script to check i18n key usage
 * - Finds keys defined in locale files but not used in code
 * - Finds keys referenced in code but not defined in locale files
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TranslationKeys {
  [key: string]: string | TranslationKeys;
}

// Flatten nested JSON keys into dot notation
function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

// Extract translation keys from source files
function extractKeysFromCode(content: string): string[] {
  const keys: string[] = [];

  // Match patterns: t('key'), t("key"), i18n.t('key'), i18n.t("key")
  // Also matches multi-line t() calls with interpolation
  const patterns = [
    /t\(['"]([^'"]+)['"]\)/g,
    /i18n\.t\(['"]([^'"]+)['"]\)/g,
    /t\(\s*['"]([^'"]+)['"]\s*,/g, // t('key', { ... })
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1];
      // Filter out invalid keys:
      // - Empty or single character keys
      // - Keys without word characters (like '.')
      // - Common HTML elements (div, span, etc.)
      const htmlElements = [
        'div',
        'span',
        'p',
        'a',
        'button',
        'input',
        'form',
        'label',
        'section',
        'header',
        'footer',
        'nav',
        'main',
        'article',
        'aside',
      ];
      if (
        key &&
        key.length > 1 &&
        key.trim() &&
        !/^[^\w]+$/.test(key) &&
        !htmlElements.includes(key.toLowerCase())
      ) {
        keys.push(key);
      }
    }
  }

  return keys;
}

// Recursively find files
function findFiles(dir: string, pattern: RegExp, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        findFiles(fullPath, pattern, files);
      }
    } else if (pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  const rootDir = path.join(__dirname, '..');
  const localesDir = path.join(rootDir, 'src', 'locales');

  // Load locale files
  console.log('📚 Loading locale files...\n');
  const enPath = path.join(localesDir, 'en.json');
  const nlPath = path.join(localesDir, 'nl.json');

  const enTranslations: TranslationKeys = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  const nlTranslations: TranslationKeys = JSON.parse(fs.readFileSync(nlPath, 'utf-8'));

  const enKeys = new Set(flattenKeys(enTranslations));
  const nlKeys = new Set(flattenKeys(nlTranslations));

  console.log(`✅ Found ${enKeys.size} keys in en.json`);
  console.log(`✅ Found ${nlKeys.size} keys in nl.json\n`);

  // Check for keys in EN but not in NL
  const missingInNl = [...enKeys].filter((key) => !nlKeys.has(key));
  if (missingInNl.length > 0) {
    console.log(`⚠️  Keys in EN but missing in NL (${missingInNl.length}):`);
    missingInNl.forEach((key) => console.log(`   - ${key}`));
    console.log('');
  }

  // Check for keys in NL but not in EN
  const missingInEn = [...nlKeys].filter((key) => !enKeys.has(key));
  if (missingInEn.length > 0) {
    console.log(`⚠️  Keys in NL but missing in EN (${missingInEn.length}):`);
    missingInEn.forEach((key) => console.log(`   - ${key}`));
    console.log('');
  }

  // Scan source files for key usage
  console.log('🔍 Scanning source files for key usage...\n');
  const srcDir = path.join(rootDir, 'src');
  const sourceFiles = findFiles(srcDir, /\.(ts|tsx)$/).filter(
    (file) =>
      !file.includes('__tests__') && !file.endsWith('.test.ts') && !file.endsWith('.test.tsx')
  );

  const usedKeys = new Set<string>();

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const keys = extractKeysFromCode(content);
    keys.forEach((key) => usedKeys.add(key));
  }

  console.log(`✅ Found ${usedKeys.size} keys used in code\n`);

  // Check for defined but unused keys
  const unusedKeys = [...enKeys].filter((key) => !usedKeys.has(key));
  if (unusedKeys.length > 0) {
    console.log(`🗑️  Keys defined but not used in code (${unusedKeys.length}):`);
    unusedKeys.slice(0, 20).forEach((key) => console.log(`   - ${key}`));
    if (unusedKeys.length > 20) {
      console.log(`   ... and ${unusedKeys.length - 20} more`);
    }
    console.log('');

    // Write unused keys to a file for removal
    if (process.argv.includes('--output-unused')) {
      const outputPath = path.join(rootDir, 'unused-keys.json');
      fs.writeFileSync(outputPath, JSON.stringify(unusedKeys, null, 2));
      console.log(`📝 Unused keys written to unused-keys.json\n`);
    }
  } else {
    console.log('✅ All defined keys are used in code\n');
  }

  // Check for used but not defined keys
  const undefinedKeys = [...usedKeys].filter((key) => !enKeys.has(key));

  // Filter out false positives (single characters, common variable names)
  const falsePositives = ['T', 'all', 'a', ' ', '-', 'code', 'error', 'error_description', ':'];
  const realUndefinedKeys = undefinedKeys.filter((key) => !falsePositives.includes(key));

  if (realUndefinedKeys.length > 0) {
    console.log(`❌ Keys used in code but not defined (${realUndefinedKeys.length}):`);
    realUndefinedKeys.forEach((key) => console.log(`   - ${key}`));
    console.log('');
  } else if (undefinedKeys.length > 0) {
    console.log(
      `⚠️  Ignored ${undefinedKeys.length} false positive keys (single chars, variable names)\n`
    );
  } else {
    console.log('✅ All used keys are defined\n');
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log(`   Total keys defined (EN): ${enKeys.size}`);
  console.log(`   Total keys defined (NL): ${nlKeys.size}`);
  console.log(`   Keys used in code: ${usedKeys.size}`);
  console.log(`   Unused keys: ${unusedKeys.length}`);
  console.log(`   Missing translations (NL): ${missingInNl.length}`);
  console.log(`   Missing translations (EN): ${missingInEn.length}`);
  console.log(`   Real undefined keys: ${realUndefinedKeys.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Exit with error if there are real issues
  // Note: missingInNl/missingInEn for months.short are expected (language differences)
  if (realUndefinedKeys.length > 0 || unusedKeys.length > 10) {
    process.exit(1);
  }
}

main();
