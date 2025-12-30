# ADR 001: Package Manager

We use **pnpm** as our package manager.

- We already use pnpm across all our other projects, keeping developer setup consistent
- Faster installs and efficient disk usage via content-addressable store
- Strict `node_modules` structure catches undeclared dependencies early
- Excellent Next.js support with no extra configuration
