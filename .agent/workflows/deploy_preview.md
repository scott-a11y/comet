---
description: Deploy to Vercel preview and run smoke tests
---

1. Push current branch
git push origin $(git branch --show-current)
// turbo

2. Trigger Vercel deployment
vercel --prod=false

3. Wait for deployment
echo "Check Vercel dashboard for preview URL"

4. Run smoke tests
npm run test:e2e -- --url=[PREVIEW_URL]
