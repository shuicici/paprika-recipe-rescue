/**
 * Paprika Recipe Parser
 * Parses .paprikarecipes files (YAML-like plain text format)
 */

const fs = require('fs');
const path = require('path');

const MULTI_LINE_FIELDS = new Set(['description', 'ingredients', 'directions', 'notes']);
const SINGLE_LINE_FIELDS = new Set([
  'name', 'servings', 'source', 'source_url', 'prep_time', 'cook_time',
  'on_favorites', 'difficulty', 'rating', 'nutritional_info', 'categories', 'photo'
]);

/**
 * Parse field value based on field name
 */
function finalize(fieldName, rawValue) {
  if (rawValue === undefined || rawValue === null) return undefined;

  const val = String(rawValue).trim();

  switch (fieldName) {
    case 'on_favorites':
      return val === 'yes';
    case 'rating': {
      const n = parseInt(val, 10);
      return isNaN(n) ? val : n;
    }
    case 'categories': {
      if (!val || val === '[]') return [];
      const m = val.match(/\[(.*)\]/s);
      if (!m) return [];
      const inner = m[1].trim();
      if (!inner) return [];
      return inner.split(',').map(s => s.trim()).filter(Boolean);
    }
    case 'photo':
      return val;
    case 'servings': {
      const m = val.match(/(\d+)/);
      return m ? parseInt(m[1], 10) : val;
    }
    case 'description':
    case 'ingredients':
    case 'directions':
    case 'notes': {
      // Strip leading "| " or "|\n" from pipe syntax
      let result = val;
      if (result.startsWith('|')) {
        result = result.slice(1);
      }
      // Remove leading whitespace after pipe
      result = result.replace(/^[\s\r\n]+/, '');
      return result;
    }
    default:
      return val;
  }
}

/**
 * Parse a .paprikarecipes content string into a recipe object
 */
function parseRecipeContent(content) {
  const lines = content.split(/\r?\n/);
  const recipe = {};
  let currentField = null;
  let currentRaw = []; // array of strings before finalize

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimEnd(); // preserve leading whitespace

    // Empty line
    if (trimmed === '') {
      if (currentField && MULTI_LINE_FIELDS.has(currentField)) {
        // Blank line in multi-line field
        if (currentRaw.length > 0 && currentRaw[currentRaw.length - 1].trim() !== '') {
          currentRaw.push('');
        }
      }
      continue;
    }

    // Field marker: "fieldname: ..." at start of line (no leading indent)
    const fieldMatch = trimmed.match(/^([a-zA-Z_]+):\s*(.*)$/);

    if (fieldMatch && !trimmed.startsWith(' ')) {
      const [, fieldName, rest] = fieldMatch;

      // Save previous field
      if (currentField) {
        recipe[currentField] = finalize(currentField, currentRaw.join('\n'));
        currentRaw = [];
      }
      currentField = null;

      if (SINGLE_LINE_FIELDS.has(fieldName)) {
        // Single-line: value is everything after colon
        // If colon-only ("field:") with no rest, it depends on next line
        if (rest === '') {
          // Look ahead: is next non-empty line indented (continuation)?
          let nextIdx = -1;
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim() !== '') { nextIdx = j; break; }
          }
          const nextLine = nextIdx >= 0 ? lines[nextIdx] : null;
          const isContinuation = nextLine && /^\s+[^\s:]/.test(nextLine);

          if (isContinuation && MULTI_LINE_FIELDS.has(fieldName)) {
            // Indented continuation follows → treat as multi-line
            currentField = fieldName;
          } else {
            // Empty single-line field
            recipe[fieldName] = finalize(fieldName, '');
          }
        } else {
          // Has value after colon
          // If it's just "|", treat as empty multi-line (content on next lines)
          if (rest === '|') {
            currentField = fieldName;
          } else {
            recipe[fieldName] = finalize(fieldName, rest);
          }
        }
      } else if (MULTI_LINE_FIELDS.has(fieldName)) {
        // Multi-line field
        if (rest === '|') {
          // Pipe-only: content on next lines
          currentField = fieldName;
        } else if (rest !== '') {
          // Inline content after colon
          currentRaw = [rest];
          currentField = fieldName;
        } else {
          // Empty multi-line (colon only)
          currentField = fieldName;
        }
      }

      continue;
    }

    // Continuation line (indented text) for active multi-line field
    if (currentField && MULTI_LINE_FIELDS.has(currentField) && /^\s/.test(trimmed)) {
      // Remove leading indentation
      const deindented = trimmed.replace(/^\s+/, '');
      currentRaw.push(deindented);
      continue;
    }

    // Non-field, non-continuation content: end current multi-line field
    if (currentField && MULTI_LINE_FIELDS.has(currentField)) {
      recipe[currentField] = finalize(currentField, currentRaw.join('\n'));
      currentRaw = [];
      currentField = null;
      // Re-process this line (don't advance i)
      i--;
      continue;
    }
  }

  // Flush last field
  if (currentField) {
    recipe[currentField] = finalize(currentField, currentRaw.join('\n'));
  }

  return recipe;
}

/**
 * Parse a .paprikarecipes file from disk
 */
async function parseRecipeFile(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  return parseRecipeContent(content);
}

/**
 * Parse all .paprikarecipes files in a directory
 */
async function parseRecipeDirectory(dirPath) {
  const files = await fs.promises.readdir(dirPath);
  const recipes = [];
  for (const file of files) {
    if (file.endsWith('.paprikarecipes')) {
      try {
        const recipe = await parseRecipeFile(path.join(dirPath, file));
        recipe._filename = file;
        recipes.push(recipe);
      } catch (err) {
        console.error(`Error parsing ${file}: ${err.message}`);
      }
    }
  }
  return recipes;
}

/**
 * CLI
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node parser.js <file.paprikarecipes | directory> [--json]');
    process.exit(1);
  }
  const target = args[0];
  const stat = await fs.promises.stat(target);
  if (stat.isDirectory()) {
    const recipes = await parseRecipeDirectory(target);
    console.log(`Parsed ${recipes.length} recipes from ${target}:`);
    for (const r of recipes) {
      console.log(`  - ${r.name} (${r._filename})`);
    }
    if (args.includes('--json')) {
      console.log('\n' + JSON.stringify(recipes, null, 2));
    }
  } else {
    const recipe = await parseRecipeFile(target);
    console.log(JSON.stringify(recipe, null, 2));
  }
}

module.exports = { parseRecipeContent, parseRecipeFile, parseRecipeDirectory };

if (require.main === module) {
  main().catch(err => { console.error('Error:', err.message); process.exit(1); });
}
