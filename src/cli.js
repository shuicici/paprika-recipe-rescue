/**
 * Paprika CLI — Command line interface
 */

const { parseRecipeFile, parseRecipeDirectory } = require('./parser');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Paprika Data Rescue CLI');
    console.log('Usage:');
    console.log('  node src/cli.js <file.paprikarecipes>       Parse a single file');
    console.log('  node src/cli.js <directory>                 Parse all .paprikarecipes in dir');
    console.log('  node src/cli.js <file> --json               Output as JSON');
    console.log('  node src/cli.js <file> --stat               Show file stats');
    process.exit(0);
  }

  const target = args[0];
  const asJson = args.includes('--json');
  const asStat = args.includes('--stat');

  try {
    const stat = await fs.promises.stat(target);

    if (stat.isDirectory()) {
      const recipes = await parseRecipeDirectory(target);
      console.log(`\n📖 Paprika Data Rescue — ${recipes.length} recipes found\n`);
      for (const r of recipes) {
        const stars = '★'.repeat(r.rating || 0) + '☆'.repeat(5 - (r.rating || 0));
        console.log(`  ${stars} ${r.name}`);
        console.log(`     Source: ${r.source || 'Unknown'} | ${r.difficulty || ''}`);
        console.log(`     Categories: ${(r.categories || []).join(', ') || 'None'}`);
        console.log('');
      }
      if (asJson) {
        console.log('\n--- JSON ---');
        console.log(JSON.stringify(recipes, null, 2));
      }
    } else if (stat.isFile()) {
      const recipe = await parseRecipeFile(target);
      if (asStat) {
        const fields = Object.keys(recipe).filter(k => !k.startsWith('_'));
        console.log(`\n📄 ${path.basename(target)}`);
        console.log(`   Fields: ${fields.join(', ')}`);
        console.log(`   Rating: ${'★'.repeat(recipe.rating || 0)}`);
        console.log(`   Ingredients: ${(recipe.ingredients || '').split('\n').filter(l => l.trim()).length} lines`);
        console.log(`   Directions: ${(recipe.directions || '').split('\n').filter(l => l.trim()).length} steps`);
      } else {
        console.log(`\n📄 ${recipe.name || path.basename(target)}`);
        console.log('='.repeat(50));
        if (recipe.description) console.log(`\n${recipe.description}`);
        console.log(`\n⭐ Rating: ${recipe.rating}/5 | ${recipe.difficulty}`);
        console.log(`🍽️  Servings: ${recipe.servings}`);
        if (recipe.prep_time) console.log(`⏱️  Prep: ${recipe.prep_time}`);
        if (recipe.cook_time) console.log(`🔥 Cook: ${recipe.cook_time}`);
        console.log(`\n📂 Categories: ${(recipe.categories || []).join(', ')}`);
        if (recipe.source) console.log(`📌 Source: ${recipe.source}`);
        if (recipe.source_url) console.log(`🔗 ${recipe.source_url}`);
        console.log('\n--- Ingredients ---');
        console.log(recipe.ingredients || '(none)');
        console.log('\n--- Directions ---');
        console.log(recipe.directions || '(none)');
        if (recipe.notes) {
          console.log('\n--- Notes ---');
          console.log(recipe.notes);
        }
        if (recipe.nutritional_info) {
          console.log(`\n📊 Nutrition: ${recipe.nutritional_info}`);
        }
      }
      if (asJson) {
        console.log('\n--- JSON ---');
        console.log(JSON.stringify(recipe, null, 2));
      }
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
