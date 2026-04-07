const { parseRecipeJSON, jsonToPaprika } = require('../src/formats/json');

describe('JSON Recipe Parser', () => {
  test('parses basic JSON recipe', () => {
    const input = {
      name: 'Test Recipe',
      servings: 4,
      prepTime: '15 min',
      cookTime: '30 min',
      source: 'Test Kitchen',
      ingredients: ['1 cup flour', '2 eggs', '1/2 cup milk'],
      instructions: ['Mix', 'Bake', 'Cool'],
      categories: ['Breakfast', 'Quick'],
      description: 'A test recipe'
    };

    const recipe = parseRecipeJSON(input);

    expect(recipe.name).toBe('Test Recipe');
    expect(recipe.servings).toBe(4);
    expect(recipe.prep_time).toBe('15 min');
    expect(recipe.cook_time).toBe('30 min');
    expect(recipe.ingredients).toEqual(['1 cup flour', '2 eggs', '1/2 cup milk']);
    expect(recipe.directions).toEqual(['Mix', 'Bake', 'Cool']);
    expect(recipe.categories).toEqual(['Breakfast', 'Quick']);
  });

  test('handles various field name variants', () => {
    const input = {
      title: 'Alt Title',
      yield: 8,
      preparationTime: '20 min',
      cookingTime: '40 min',
      author: 'Chef',
      url: 'https://example.com',
      summary: 'A summary',
      tags: ['Dinner', 'Italian'],
      recipeIngredient: ['3 cloves garlic'],
      recipeInstructions: ['Step 1', 'Step 2']
    };

    const recipe = parseRecipeJSON(input);

    expect(recipe.name).toBe('Alt Title');
    expect(recipe.servings).toBe(8);
    expect(recipe.prep_time).toBe('20 min');
    expect(recipe.cook_time).toBe('40 min');
    expect(recipe.source).toBe('Chef');
    expect(recipe.source_url).toBe('https://example.com');
    expect(recipe.description).toBe('A summary');
    expect(recipe.categories).toEqual(['Dinner', 'Italian']);
    expect(recipe.ingredients).toEqual(['3 cloves garlic']);
    expect(recipe.directions).toEqual(['Step 1', 'Step 2']);
  });

  test('normalizes ISO 8601 durations', () => {
    const input1 = { name: 'Test', prepTime: 'PT30M' };
    const input2 = { name: 'Test', prepTime: 'PT1H30M' };
    const input3 = { name: 'Test', prepTime: 'PT2H' };

    expect(parseRecipeJSON(input1).prep_time).toBe('30 min');
    expect(parseRecipeJSON(input2).prep_time).toBe('1 hr 30 min');
    expect(parseRecipeJSON(input3).prep_time).toBe('2 hr');
  });

  test('converts JSON to Paprika format', () => {
    const input = {
      name: 'JSON Recipe',
      servings: 6,
      prepTime: '10 min',
      ingredients: ['1 lb chicken'],
      instructions: ['Cook chicken'],
      categories: ['Dinner']
    };

    const paprika = jsonToPaprika(input);
    expect(paprika).toContain('name: JSON Recipe');
    expect(paprika).toContain('servings: 6');
    expect(paprika).toContain('ingredients: |');
  });
});
