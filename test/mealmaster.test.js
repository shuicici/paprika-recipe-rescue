const { parseMX2, mealmasterToPaprika } = require('../src/formats/mealmaster');

describe('MealMaster MX2 Parser', () => {
  test('parses basic MealMaster recipe', () => {
    const content = `MMX2
Title: Chocolate Chip Cookies
Categories: Dessert, Cookies
Servings: 24
Prep Time: 15 min
Cook Time: 10 min
Source: Grandma's Kitchen

* Ingredients *
1 cup butter
1 cup sugar
2 cups flour
1 bag chocolate chips

* Directions *
1. Preheat oven to 350°F
2. Cream butter and sugar
3. Add flour and mix
4. Stir in chocolate chips
5. Drop spoonfuls on baking sheet
6. Bake 10 minutes

* Notes *
Can add walnuts for extra crunch.`;

    const recipe = parseMX2(content);

    expect(recipe.name).toBe('Chocolate Chip Cookies');
    expect(recipe.servings).toBe(24);
    expect(recipe.categories).toContain('Dessert');
    expect(recipe.ingredients).toContain('1 cup butter');
    expect(recipe.directions.length).toBeGreaterThan(0);
    expect(recipe.notes).toContain('walnuts');
  });

  test('handles minimal recipe', () => {
    const content = `MMX2
Title: Simple Soup
* Ingredients *
1 can beans
* Directions *
1. Heat beans
2. Serve`;

    const recipe = parseMX2(content);
    expect(recipe.name).toBe('Simple Soup');
    expect(recipe.ingredients).toContain('1 can beans');
    expect(recipe.directions).toContain('1. Heat beans');
  });

  test('converts to Paprika format', () => {
    const content = `MMX2
Title: Test Recipe
Categories: Quick
Servings: 4
* Ingredients *
2 eggs
* Directions *
1. Boil eggs`;

    const paprika = mealmasterToPaprika(content);
    expect(paprika).toContain('name: Test Recipe');
    expect(paprika).toContain('servings: 4');
    expect(paprika).toContain('ingredients: |');
  });
});
