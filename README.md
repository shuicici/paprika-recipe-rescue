# Paprika Data Rescue 🥘

A Node.js MVP for parsing, viewing, and exporting Paprika Recipe Manager `.paprikarecipes` files.

## Paprika Format

Paprika uses a plain-text, YAML-like format for recipe export/import:

```
name: Recipe Name
servings: 4 servings
source: Source Name
source_url: https://example.com
prep_time: 10 min
cook_time: 30 min
difficulty: Easy
rating: 5
on_favorites: yes
categories: [Dinner, Quick]
nutritional_info: 350 calories
description: |
 Multi-line description text.
ingredients: |
 1 cup flour
 2 eggs
 1/2 cup milk
directions: |
 Step 1: Mix
 Step 2: Bake
 Step 3: Cool
notes: |
 Chef's tip here.
photo: (base-64 encoded image)
```

## Quick Start

```bash
cd paprika-mvp
npm install
npm start
# → Open http://localhost:3000
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/recipes` | List all recipes |
| GET | `/api/recipes/:name` | Get single recipe by name |
| GET | `/api/export/:name` | Download recipe as `.paprikarecipes` |
| GET | `/api/export/all` | Download all recipes as single combined `.paprikarecipes` |
| POST | `/api/recipes/parse` | Parse uploaded `.paprikarecipes` |
| POST | `/api/recipes/batch-parse` | Batch-parse multiple `.paprikarecipes` files |
| POST | `/api/convert/mealmaster` | Convert MealMaster MX2 format → `.paprikarecipes` |

## CLI

```bash
# Parse a directory
node src/cli.js recipes/

# Parse a single file
node src/cli.js recipes/grandmas-meatloaf.paprikarecipes

# Output as JSON
node src/cli.js recipes/ --json

# Show file stats
node src/cli.js recipes/ --stat
```

## File Format Discovery

The `.paprikarecipes` format was reverse-engineered from the [cookbook-importer](https://github.com/ebridges/cookbook-importer) GitHub project (MIT license). Paprika's internal database is SQLite-based, but the import/export format is plain text.

## Project Structure

```
paprika-mvp/
├── recipes/              # Sample .paprikarecipes files
├── src/
│   ├── parser.js          # Core parser (YAML-like → JSON)
│   ├── server.js         # Express API server
│   └── cli.js            # Command-line tool
├── public/
│   └── index.html        # Recipe web UI
├── test/
│   └── parser.test.js    # Jest tests (6 passing)
├── package.json
└── README.md
```

## Running Tests

```bash
npm test
```

## Paprika MVP Strategy

**Problem**: Paprika Recipe Manager has no proper data export. Users who accumulated years of recipes are locked in. The developer is unresponsive.

**Solution**: Build a free web tool + eventually a paid migration service that lets Paprika users:
1. Export their recipes as standard `.paprikarecipes` files
2. Import into any other recipe app that supports the format

**Status**: MVP parser + web UI complete. Format fully reverse-engineered.
