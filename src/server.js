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
    // Return lightweight list (no full content)
    const list = recipes.map(r => ({
      name: r.name,
      source: r.source,
      rating: r.rating,
      categories: r.categories,
      servings: r.servings,
      difficulty: r.difficulty,
      prep_time: r.prep_time,
      cook_time: r.cook_time,
      filename: r._filename
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

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Paprika Data Rescue running at http://localhost:${PORT}`);
  console.log(`Serving recipes from: ${RECIPES_DIR}`);
});
