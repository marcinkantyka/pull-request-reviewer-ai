# Build Instructions

## Issue
The build was outputting to `dist/index.js` but the package expects `dist/cli/index.js`.

## Solution
The `tsup.config.ts` has been updated. Rebuild the project:

```bash
npm run build
```

## Quick Fix (Temporary)
If you need to run it immediately without rebuilding, you can:

```bash
# Option 1: Use the existing build
node dist/index.js --help

# Option 2: Create a symlink
mkdir -p dist/cli
ln -s ../index.js dist/cli/index.js
node dist/cli/index.js --help
```

## After Rebuild
Once rebuilt, the correct structure will be:
```
dist/
  cli/
    index.js
    index.js.map
```

Then you can run:
```bash
node dist/cli/index.js --help
```
