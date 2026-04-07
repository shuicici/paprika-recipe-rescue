/**
 * Paprika Data Rescue — Express Server
 */

const express = require('express');
const path = require('path');
const { parseRecipeFile, parseRecipeDirectory } = require('./parser');

const app = express();
const PORT = process.env.PORT || 3000;
const RECIPES_DIR = path.join(__dirname, '..', 'recipes');

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// GET /api/recipes — list all recipes
app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await parseRecipeDirectory(RECIPES_DIR);
    const list = recipes.map(r => ({
      name: r.name, source: r.source, rating: r.rating,
      categories: r.categories, servings: r.servings,
      difficulty: r.difficulty, prep_time: r.prep_time,
      cook_time: r.cook_time, filename: r._filename
    }));
    res.json({ recipes: list, count: list.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recipes/:name — get single recipe by name (URL decoded)
app.get('/api/recipes/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const recipes = await parseRecipeDirectory(RECIPES_DIR);
    const recipe = recipes.find(r => r.name === name);
    if (!recipe) {
      return res.status(404).json({ error: `Recipe not found: ${name}` });
    }
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/:name — export recipe as .paprikarecipes text
app.get('/api/export/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const recipes = await parseRecipeDirectory(RECIPES_DIR);
    const recipe = recipes.find(r => r.name === name);
    if (!recipe) {
      return res.status(404).json({ error: `Recipe not found: ${name}` });
    }
    const text = exportRecipe(recipe);
    res.type('text/plain');
    res.attachment(`${sanitizeFilename(recipe.name)}.paprikarecipes`);
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recipes/parse — parse uploaded .paprikarecipes file
app.post('/api/recipes/parse', async (req, res) => {
  try {
    const { content, filename } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Missing content field in request body' });
    }
    const { parseRecipeContent } = require('./parser');
    const recipe = parseRecipeContent(content);
    res.json({ recipe, filename: filename || 'upload.paprikarecipes' });
  } catch (err) {
    res.status(500).json({ error: `Parse error: ${err.message}` });
  }
});

// POST /api/recipes/batch-parse — parse multiple .paprikarecipes files at once
app.post('/api/recipes/batch-parse', async (req, res) => {
  try {
    const { files } = req.body;
    if (!Array.isArray(files)) {
      return res.status(400).json({ error: 'files must be an array of {content, filename} objects' });
    }
    const { parseRecipeContent } = require('./parser');
    const results = files.map(({ content, filename }) => {
      try {
        const recipe = parseRecipeContent(content);
        return { ok: true, recipe, filename };
      } catch (err) {
        return { ok: false, filename, error: err.message };
      }
    });
    const ok = results.filter(r => r.ok);
    const failed = results.filter(r => !r.ok);
    res.json({ total: files.length, successful: ok.length, failed: failed.length, results });
  } catch (err) {
    res.status(500).json({ error: `Batch parse error: ${err.message}` });
  }
});

// GET /api/export/all — export all recipes as single combined .paprikarecipes file
app.get('/api/export/all', async (req, res) => {
  try {
    const recipes = await parseRecipeDirectory(RECIPES_DIR);
    if (!recipes.length) {
      return res.status(404).json({ error: 'No recipes to export' });
    }
    const combined = recipes.map(r => exportRecipe(r)).join('\n\n' + '='.repeat(50) + '\n\n');
    res.type('text/plain');
    res.attachment(`paprika-export-${Date.now()}.paprikarecipes`);
    res.send(combined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Export a recipe object to .paprikarecipes text format
 */
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
  add('servings', recipe.servings ? `${recipe.servings} servings` : '');
  add('source', recipe.source);
  add('source_url', recipe.source_url);
  add('prep_time', recipe.prep_time);
  add('cook_time', recipe.cook_time);
  add('difficulty', recipe.difficulty);
  if (recipe.rating !== undefined) add('rating', recipe.rating);
  if (recipe.on_favorites) add('on_favorites', 'yes');
  if (recipe.categories && recipe.categories.length) {
    add('categories', `[${recipe.categories.join(', ')}]`);
  }
  add('nutritional_info', recipe.nutritional_info);
  addML('description', recipe.description);
  addML('ingredients', recipe.ingredients);
  addML('directions', recipe.directions);
  addML('notes', recipe.notes);
  add('photo', recipe.photo || '');

  return lines.join('\n');
}

function sanitizeFilename(name) {
  return String(name).replace(/[^a-z0-9]/gi, '-').toLowerCase();
}

module.exports = { exportRecipe };

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Paprika Data Rescue running at http://localhost:${PORT}`);
  console.log(`Serving recipes from: ${RECIPES_DIR}`);
});
