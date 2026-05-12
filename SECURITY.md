# Security practices

## Supply chain protection

This project enforces a minimum release age policy for npm dependencies, mitigating supply chain attacks where compromised package versions are typically detected and yanked within hours of publication.

The policy requires any installed package version to be at least **14 days old** at install time, set globally via:

\`\`\`bash
npm config set min-release-age=14
\`\`\`

Requires npm 11.10.0 or newer. The same concept exists under different names in other package managers (`minimumReleaseAge` in pnpm and Bun, `npmMinimalAgeGate` in Yarn).

Rationale: most reported supply chain attacks in 2025-2026 (axios, Solana web3.js, ua-parser-js, etc.) were detected and pulled within 4-5 hours of publication. A 14-day window trades some "ship fast" velocity for meaningful protection across this entire class of attacks.

## Other practices

- Public repository — accidental secret leaks or compromised dependencies are visible
- Environment variables — never committed (`.env*` ignored)
- API keys — scoped to specific projects, easy to rotate
