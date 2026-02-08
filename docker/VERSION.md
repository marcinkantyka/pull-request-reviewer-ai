# Version Management

The Docker setup automatically reads the version from `package.json` - no manual updates needed!

## How It Works

1. **Single Source of Truth**: Version is defined in `package.json`
2. **Automatic Reading**: Scripts (`start.sh`, `run-review.sh`) automatically read the version
3. **Docker Compose**: Uses environment variable `PR_REVIEW_VERSION` set by `start.sh`

## Updating Version

Simply update the version in `package.json`:

```json
{
  "version": "1.1.0"
}
```

Then rebuild:

```bash
cd docker
docker-compose build pr-review
docker compose build pr-review
```

The version will automatically be used in:

- Docker image tags
- All scripts that reference the image

## Manual Override

If needed, you can override the version:

```bash
export PR_REVIEW_VERSION=1.1.0
docker-compose build pr-review
```
