/**
 * MealMaster (.mx2) format parser
 * Standard recipe interchange format used by many Windows recipe programs
 * Reference: https://github.com/ebridges/cookbook-importer
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse MealMaster MX2 format into recipe object
 * MX2 format: MMXX header + recipe blocks
 */
function parseMX2(content) {
  const lines = content.split(/\r?\n/);
  const recipe = {
    name: '',
    servings: 0,
    prep_time: '',
    cook_time: '',
    source: '',
    ingredients: [],
    directions: [],
    categories: [],
    notes: ''
  };

  let currentSection = null; // 'header', 'recipe', 'ingredients', 'directions', 'notes'
  let headerProcessed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();

    // MealMaster header markers
    if (upper.startsWith('MMX2')) {
      continue;
    }

    // Recipe title
    if (upper.startsWith('TITLE:')) {
      recipe.name = line.substring(6).trim();
      continue;
    }

    // Categories
    if (upper.startsWith('CATEGORIES:')) {
      const cats = line.substring(11).trim();
      if (cats) cats.split(',').map(c => c.trim()).filter(c => c).forEach(c => recipe.categories.push(c));
      continue;
    }
    if (upper.startsWith('CAT:')) {
      const cats = line.substring(4).trim();
      if (cats) cats.split(',').map(c => c.trim()).filter(c => c).forEach(c => recipe.categories.push(c));
      continue;
    }

    // Yield/servings
    if (upper.startsWith('YIELD:') || upper.startsWith('SERVINGS:')) {
      const val = line.match(/\d+/);
      if (val) recipe.servings = parseInt(val[0], 10);
      continue;
    }

    // Times
    if (upper.startsWith('PREP TIME:')) {
      recipe.prep_time = line.substring(10).trim();
      continue;
    }
    if (upper.startsWith('COOK TIME:') || upper.startsWith('COOKING TIME:')) {
      recipe.cook_time = line.substring(10).trim();
      continue;
    }

    // Source
    if (upper.startsWith('SOURCE:')) {
      recipe.source = line.substring(7).trim();
      continue;
    }

    // Section headers
    if (upper.startsWith('---') || upper.startsWith('*')) {
      const section = upper.replace(/[-*]/g, '').trim().toLowerCase();
      if (section.includes('ingredient')) currentSection = 'ingredients';
      else if (section.includes('direction') || section.includes('instruction')) currentSection = 'directions';
      else if (section.includes('note')) currentSection = 'notes';
      continue;
    }

    // Ingredients: lines starting with measure pattern like "1 cup", "2 tbsp", "1/2 lb"
    const ingredientMatch = line.match(/^[\s]*(.+)/);
    if (ingredientMatch && currentSection === 'ingredients') {
      const ing = ingredientMatch[1].trim();
      if (ing && !ing.match(/^(---|\*)/)) {
        recipe.ingredients.push(ing);
      }
      continue;
    }

    // Directions
    if (currentSection === 'directions') {
      const dir = line.trim();
      if (dir && !dir.match(/^(---|\*)/)) {
        recipe.directions.push(dir);
      }
      continue;
    }

    // Notes
    if (currentSection === 'notes') {
      const note = line.trim();
      if (note && !note.match(/^(---|\*)/)) {
        recipe.notes += (recipe.notes ? '\n' : '') + note;
      }
      continue;
    }
  }

  return recipe;
}

/**
 * Convert MealMaster recipe to Paprika .paprikarecipes format
 */
function mealmasterToPaprika(mx2Content) {
  const recipe = parseMX2(mx2Content);
  return exportRecipe(recipe);
}

function exportRecipe(recipe) {
  const lines = [];
  const add = (k, v) => { if (v !== undefined && v !== null && v !== '') lines.push(`${k}: ${v}`); };
  const addML = (k, v) => {
    if (v !== undefined && v !== null && v !== '') {
      lines.push(`${k}: |`);
      v.split('\n').forEach(l => lines.push(` ${l}`));
    } else {
      lines.push(`${k}:`);
    }
  };

  add('name', recipe.name);
  add('servings', typeof recipe.servings === 'number' ? String(recipe.servings) : recipe.servings || '');
  add('source', recipe.source);
  add('prep_time', recipe.prep_time);
  add('cook_time', recipe.cook_time);
  add('difficulty', recipe.difficulty);
  if (recipe.rating !== undefined) add('rating', recipe.rating);
  if (recipe.on_favorites) add('on_favorites', 'yes');
  if (recipe.categories && recipe.categories.length) {
    add('categories', `[${recipe.categories.join(',')}]`);
  }
  add('nutritional_info', recipe.nutritional_info);
  addML('description', recipe.description);
  addML('ingredients', recipe.ingredients.join('\n'));
  addML('directions', recipe.directions.join('\n'));
  addML('notes', recipe.notes);

  return lines.join('\n');
}

async function parseMX2File(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  return parseMX2(content);
}

module.exports = { parseMX2, mealmasterToPaprika, parseMX2File };
