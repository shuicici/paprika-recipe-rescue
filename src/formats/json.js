/**
 * Generic JSON recipe format parser
 * Accepts structured JSON recipes from any source
 * Supports common schema formats (RecipeAPI, schema.org/Recipe, etc.)
 */

const fs = require('fs');

/**
 * Parse a JSON recipe object into internal format
 * Handles various JSON recipe schemas
 */
function parseRecipeJSON(input) {
  let recipe;

  if (typeof input === 'string') {
    try {
      recipe = JSON.parse(input);
    } catch (err) {
      throw new Error(`Invalid JSON: ${err.message}`);
    }
  } else {
    recipe = input;
  }

  const result = {
    name: '',
    servings: 0,
    prep_time: '',
    cook_time: '',
    source: '',
    source_url: '',
    ingredients: [],
    directions: [],
    categories: [],
    notes: '',
    description: '',
    nutritional_info: '',
    rating: undefined,
    on_favorites: false,
    difficulty: '',
    photo: ''
  };

  // Name (required)
  result.name = recipe.name
    || recipe.title
    || recipe.recipeName
    || recipe.titleOfRecipe
    || '';

  // Servings
  const servingsRaw = recipe.servings
    || recipe.yield
    || recipe.recipeYield
    || recipe.yield_amount
    || '';
  if (typeof servingsRaw === 'number') {
    result.servings = servingsRaw;
  } else if (typeof servingsRaw === 'string') {
    const match = String(servingsRaw).match(/\d+/);
    result.servings = match ? parseInt(match[0], 10) : 0;
  }

  // Times (parse "30 min", "1 hour", etc.)
  result.prep_time = normalizeTime(recipe.prepTime || recipe.prep_time || recipe.preparationTime || '');
  result.cook_time = normalizeTime(recipe.cookTime || recipe.cook_time || recipe.cookingTime || recipe.totalTime || '');

  // Source
  result.source = recipe.source
    || recipe.author
    || recipe.authorName
    || recipe.attribution
    || '';

  result.source_url = recipe.sourceUrl
    || recipe.url
    || recipe.source_url
    || recipe.link
    || '';

  // Description
  result.description = recipe.description
    || recipe.summary
    || recipe.abstract
    || '';

  // Notes
  result.notes = recipe.notes
    || recipe.comment
    || recipe.comments
    || '';

  // Categories
  const cats = recipe.categories
    || recipe.category
    || recipe.tags
    || recipe.keywords
    || [];
  if (typeof cats === 'string') {
    result.categories = cats.split(',').map(c => c.trim()).filter(Boolean);
  } else if (Array.isArray(cats)) {
    result.categories = cats.map(c => typeof c === 'string' ? c.trim() : (c.name || c.label || String(c))).filter(Boolean);
  }

  // Rating
  if (recipe.rating !== undefined) {
    if (typeof recipe.rating === 'number') {
      result.rating = recipe.rating;
    } else if (typeof recipe.rating === 'string') {
      const m = recipe.rating.match(/(\d+(?:\.\d+)?)/);
      if (m) result.rating = parseFloat(m[1]);
    }
  } else if (recipe.aggregateRating) {
    result.rating = parseFloat(recipe.aggregateRating.ratingValue) || undefined;
  }

  // Difficulty
  result.difficulty = recipe.difficulty
    || recipe.level
    || recipe.hardLevel
    || '';

  // Ingredients
  const ingredients = recipe.ingredients
    || recipe.ingredientList
    || recipe.recipeIngredient
    || recipe.ingredients_list
    || [];
  if (typeof ingredients === 'string') {
    result.ingredients = ingredients.split('\n').filter(Boolean);
  } else if (Array.isArray(ingredients)) {
    result.ingredients = ingredients
      .map(i => typeof i === 'string' ? i.trim() : (i.text || i.name || i.amount || String(i)))
      .filter(Boolean);
  }

  // Directions / Instructions
  const instructions = recipe.directions
    || recipe.instructions
    || recipe.recipeInstructions
    || recipe.steps
    || recipe.method
    || [];
  if (typeof instructions === 'string') {
    result.directions = instructions.split('\n').filter(Boolean);
  } else if (Array.isArray(instructions)) {
    result.directions = instructions.map(i => {
      if (typeof i === 'string') return i.trim();
      if (i.text) return i.text.trim();
      if (i.name) return i.name.trim();
      if (i.instruction) return i.instruction.trim();
      return String(i).trim();
    }).filter(Boolean);
  }

  // Photo
  if (recipe.photo) {
    if (typeof recipe.photo === 'string') result.photo = recipe.photo;
    else if (recipe.photo.url) result.photo = recipe.photo.url;
    else if (recipe.photo.data) result.photo = recipe.photo.data;
    else if (recipe.image) result.photo = typeof recipe.image === 'string' ? recipe.image : (recipe.image.url || '');
  } else if (recipe.image) {
    result.photo = typeof recipe.image === 'string' ? recipe.image
      : (Array.isArray(recipe.image) ? recipe.image[0] : recipe.image.url || '');
  } else if (recipe.images) {
    const img = Array.isArray(recipe.images) ? recipe.images[0] : recipe.images;
    result.photo = typeof img === 'string' ? img : (img.url || '');
  }

  // Nutritional info
  if (recipe.nutrition) {
    const n = recipe.nutrition;
    const parts = [];
    if (n.calories) parts.push(n.calories);
    if (n.servingSize) parts.push(n.servingSize);
    if (n.protein) parts.push(`${n.protein} protein`);
    if (n.fat) parts.push(`${n.fat} fat`);
    if (n.carbohydrates) parts.push(`${n.carbohydrates} carbs`);
    if (n.fiber) parts.push(`${n.fiber} fiber`);
    result.nutritional_info = parts.join(' | ');
  } else if (recipe.nutritionalInfo) {
    result.nutritional_info = recipe.nutritionalInfo;
  }

  return result;
}

/**
 * Normalize time strings to "X min" / "X hour Y min" format
 */
function normalizeTime(time) {
  if (!time) return '';
  const str = String(time).trim().toLowerCase();

  // Already formatted
  if (str.match(/^\d+\s*(min|hr|hour|minute|hour)/)) {
    return str.replace(/\s*(minutes?|hours?|mins?|hrs?)\s*/gi, match => {
      if (match.includes('hour') || match.includes('hr')) {
        return match.replace(/hours?|hrs?/gi, 'hr');
      }
      return match.replace(/minutes?|mins?/gi, 'min');
    }).trim();
  }

  // Minutes only
  const minMatch = str.match(/(\d+)\s*(?:minutes?|mins?)/);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remaining = mins % 60;
      return remaining ? `${hrs} hr ${remaining} min` : `${hrs} hr`;
    }
    return `${mins} min`;
  }

  // Hours only
  const hrMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/);
  if (hrMatch) {
    const hrs = parseFloat(hrMatch[1]);
    if (hrs % 1 === 0) return `${hrs} hr`;
    return `${hrs} hr`;
  }

  // ISO 8601 duration (PT30M, PT1H30M)
  const isoMatch = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (isoMatch) {
    const hrs = parseInt(isoMatch[1] || '0', 10);
    const mins = parseInt(isoMatch[2] || '0', 10);
    if (hrs && mins) return `${hrs} hr ${mins} min`;
    if (hrs) return `${hrs} hr`;
    if (mins) return `${mins} min`;
  }

  return str;
}

function jsonToPaprika(jsonInput) {
  const recipe = parseRecipeJSON(jsonInput);
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
  add('source_url', recipe.source_url);
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
  add('photo', recipe.photo || '');

  return lines.join('\n');
}

module.exports = { parseRecipeJSON, jsonToPaprika, exportRecipe };
