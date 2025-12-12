# Claude Code Context

## Vercel Environment Variables

When adding environment variables to Vercel via CLI, use `printf` instead of `echo` to avoid adding a trailing newline (`\n`) that corrupts API keys and other values.

```bash
# WRONG - echo adds \n to the value
echo "my-api-key" | vercel env add VAR_NAME production

# CORRECT - printf does not add \n
printf "my-api-key" | vercel env add VAR_NAME production
```

## Deployment

After adding/updating env vars, redeploy with `--force` to skip cache:
```bash
vercel --prod --force
```
