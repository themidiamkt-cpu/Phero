<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Instruções para o Codex

Evite analisar, indexar ou modificar estas pastas:

- node_modules
- .next
- .git
- dist
- build
- coverage
- .vercel

Priorize apenas:

- src/app
- src/components
- src/lib
- app
- pages
- components
- lib
- hooks
- utils
- supabase
- prisma
- public
- middleware.ts
- package.json
- tsconfig.json
- next.config.js
- next.config.ts

Nunca rode comandos pesados sem autorização.
