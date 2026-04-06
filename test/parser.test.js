const { parseRecipeContent } = require('../src/parser');

describe('Paprika Recipe Parser', () => {
  test('parses basic recipe with all fields', () => {
    const content = `name: Test Recipe
servings: 4 servings
source: Test Kitchen
prep_time: 10 min
cook_time: 30 min
on_favorites: yes
categories: [Breakfast, Quick]
nutritional_info: 300 calories
difficulty: Easy
rating: 5
notes: |
 This is a test note
 on multiple lines.
description: |
 A test recipe description
 that spans two lines.
ingredients: |
 1 cup flour
 2 eggs
 1/2 cup milk
directions: |
 Step 1: Mix
 Step 2: Bake
 Step 3: Eat`;

    const recipe = parseRecipeContent(content);

    expect(recipe.name).toBe('Test Recipe');
    expect(recipe.servings).toBe(4);
    expect(recipe.source).toBe('Test Kitchen');
    expect(recipe.prep_time).toBe('10 min');
    expect(recipe.cook_time).toBe('30 min');
    expect(recipe.on_favorites).toBe(true);
    expect(recipe.difficulty).toBe('Easy');
    expect(recipe.rating).toBe(5);
    expect(recipe.categories).toEqual(['Breakfast', 'Quick']);
    expect(recipe.nutritional_info).toBe('300 calories');
    expect(recipe.notes).toBe('This is a test note\non multiple lines.');
    expect(recipe.description).toBe('A test recipe description\nthat spans two lines.');
    expect(recipe.ingredients).toBe('1 cup flour\n2 eggs\n1/2 cup milk');
    expect(recipe.directions).toBe('Step 1: Mix\nStep 2: Bake\nStep 3: Eat');
  });

  test('handles recipe without optional fields', () => {
    const content = `name: Minimal Recipe
ingredients: |
 1 ingredient
directions: |
 1 step`;

    const recipe = parseRecipeContent(content);
    expect(recipe.name).toBe('Minimal Recipe');
    expect(recipe.rating).toBeUndefined();
    expect(recipe.servings).toBeUndefined();
    expect(recipe.categories).toBeUndefined();
    expect(recipe.on_favorites).toBeUndefined();
  });

  test('handles empty photo field', () => {
    const content = `name: No Photo Recipe
photo: 
ingredients: |
 1 egg`;

    const recipe = parseRecipeContent(content);
    expect(recipe.photo).toBe('');
  });

  test('handles source_url field', () => {
    const content = `name: Web Recipe
source_url: https://example.com/recipe
ingredients: |
 1 cup water
directions: |
 Boil water`;

    const recipe = parseRecipeContent(content);
    expect(recipe.source_url).toBe('https://example.com/recipe');
  });

  test('handles single category', () => {
    const content = `name: Single Cat
categories: [Lunch]
ingredients: |
 1 salad
directions: |
 Eat`;

    const recipe = parseRecipeContent(content);
    expect(recipe.categories).toEqual(['Lunch']);
  });

  test('handles off_favorites as false', () => {
    const content = `name: Not Favorite
on_favorites: no
ingredients: |
 1 item
directions: |
 1 step`;

    const recipe = parseRecipeContent(content);
    expect(recipe.on_favorites).toBe(false);
  });
});
