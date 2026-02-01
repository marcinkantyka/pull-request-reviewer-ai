# Build Instructions

## Building the Project

The project uses `tsup` to build TypeScript to JavaScript. The build output is located at `dist/cli/index.js`.

### Build Command

```bash
npm run build
```

This will:

- Compile TypeScript to JavaScript
- Output to `dist/cli/index.js`
- Generate source maps
- Bundle all dependencies

### Build Output Structure

After building, the structure will be:

```
dist/
  cli/
    index.js        # Main executable
    index.js.map    # Source map
```

### Running After Build

```bash
# Run the CLI
node dist/cli/index.js --help

# Or link globally for easier access
npm link
pr-review --help
```

### Development Mode

For development with auto-rebuild on file changes:

```bash
npm run dev
```

This will watch for changes and rebuild automatically.

### Troubleshooting

**Build fails:**

- Ensure all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (needs 18+)
- Clear and rebuild: `npm run clean && npm run build`

**Module not found errors:**

- Run `npm install` to ensure all dependencies are installed
- Check that `node_modules` exists and contains required packages
