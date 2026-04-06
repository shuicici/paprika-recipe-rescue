# Paprika Data Rescue MVP — Specification

## Overview
A Node.js-based tool that parses `.paprikarecipes` files (Paprika Recipe Manager format) and provides:
1. Recipe parsing library (Node.js)
2. Web API to import/export recipes
3. Basic recipe display web UI

## Paprika Format Spec (from `cookbook-importer`)

```
name: Recipe Name
servings: 4-6 servings
source: Source name
source_url: http://example.com
prep_time: 10 min
cook_time: 30 min
on_favorites: yes
categories: [Dinner, Holiday]
nutritional_info: 500 calories
difficulty: Easy
rating: 5
notes: |
 Multi-line notes
description: |
 Multi-line description
ingredients: |
 1 cup flour
 2 eggs
directions: |
 Step 1
 Step 2
photo: (base-64 encoded image - optional)
```

**Key observations:**
- YAML-like plain text format
- Multi-line fields use `|` pipe syntax
- Categories stored as JSON-like array: `[Cat1, Cat2]`
- `photo:` field optional, base-64 encoded
- `on_favorites:` = boolean (yes/no)
- `servings:` free text (e.g., "4-6 servings", "8 servings")

## Tech Stack
- **Runtime**: Node.js
- **Parser**: Custom (regex + line-by-line, no YAML dep needed)
- **Web**: Express.js
- **Frontend**: Vanilla HTML/CSS/JS (simple, portable)
- **Testing**: Jest

## Files Structure
```
paprika-mvp/
├── recipes/          # Sample .paprikarecipes files
├── src/
│   ├── parser.js     # Core parser
│   └── server.js     # Express API server
├── public/
│   └── index.html    # Recipe display UI
├── test/
│   └── parser.test.js
├── package.json
└── MVP_SPEC.md
```

## Features (MVP Scope)
1. **Parse .paprikarecipes** → JSON recipe object
2. **Parse directory of recipes** → recipe collection
3. **Export recipe** → JSON
4. **Web UI**: List recipes, view recipe detail
5. **Import**: Upload .paprikarecipes file via web UI

## Non-Goals (v1)
- Cloud sync
- Recipe editing
- Photo handling beyond display
- Category management
- Search/filter

## Running
```bash
npm install
npm start        # Start server on port 3000
npm test         # Run parser tests
```
