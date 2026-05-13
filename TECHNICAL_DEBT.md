# Technical Debt & Future Migrations

This document tracks known deprecations, technical debt, and planned migrations that need attention in future versions.

## Active Items

### 1. Next.js Middleware to Proxy Migration

**Status:** Waiting for upstream library support  
**Priority:** Medium (works fine, just deprecated)  
**Added:** 2026-05-13  
**Next Check:** When Next.js 17 is announced or next-intl releases proxy support

**Issue:**
Next.js 16 deprecated the `middleware.ts` file convention in favor of `proxy.ts`. However, we use `next-intl`'s middleware wrapper which hasn't migrated to the new pattern yet.

**Current Warning:**
```
⚠ The "middleware" file convention is deprecated. 
  Please use "proxy" instead. 
  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
```

**Current Implementation:**
```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);
```

**Why we can't fix it yet:**
- We use `next-intl@4.11.0` which only exports middleware, not proxy
- The Next.js codemod (`npx @next/codemod@canary middleware-to-proxy`) doesn't work with library-wrapped middleware
- Even `next-intl@4.12.0` (latest as of 2026-05-13) still uses middleware pattern

**Action Required:**
1. Monitor `next-intl` releases for proxy support
2. Check GitHub: https://github.com/amannn/next-intl/issues (search for "proxy")
3. When available, follow `next-intl`'s migration guide
4. Expected migration will involve:
   - Renaming `src/middleware.ts` to `src/proxy.ts`
   - Updating import from `next-intl/middleware` to `next-intl/proxy` (or similar)
   - Possibly updating the config/matcher syntax

**How to Check Status:**

```bash
# Check for next-intl updates
npm info next-intl version

# Check if proxy export exists
npm view next-intl exports | grep proxy

# Check GitHub issues
# Visit: https://github.com/amannn/next-intl/issues?q=proxy
```

**References:**
- Next.js docs: https://nextjs.org/docs/messages/middleware-to-proxy
- next-intl repo: https://github.com/amannn/next-intl

---

## Completed Migrations

None yet.

---

## How to Use This Document

**At the start of each development session:**
1. Review "Active Items" section
2. Check if any upstream dependencies have updates
3. For each item marked "Next Check: [date]", verify if action is needed
4. Update status or move items to "Completed Migrations" when resolved

**When adding new technical debt:**
1. Add to "Active Items" with all required fields
2. Include clear "Action Required" steps
3. Set appropriate priority: High / Medium / Low
4. Add "Next Check" date or trigger condition
