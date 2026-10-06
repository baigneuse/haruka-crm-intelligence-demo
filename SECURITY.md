# Security policy

## Scope

This is a sanitized portfolio edition that runs on fictional data. It contains no production credentials, customer records, deployment identifiers, or privileged administration routes.

## Safe local use

- Keep `.env` and `.env.local` files untracked.
- Never add a real service-role key, database password, access token, or production URL.
- Use the synthetic in-memory repository for the public demo.
- Treat the PostgreSQL schema and repository adapter as an integration boundary, not as authorization.

## Deployment boundary

The included API is read-only and intended for demonstration. The public deployment packages only synthetic data and bounded computation (8 KiB UTF-8 JSON requests). It excludes the PostgreSQL adapter and uses no secrets or database connection. Unknown write/import/reset/admin routes return 404. Responses do not include stack traces, and API results use `Cache-Control: no-store`.

The application does not log or persist questions, use browser storage, cookies or tracking. Do not enter personal or confidential information. Hosting providers can retain access metadata; configure platform-level abuse/cost controls before public exposure. No application-level authentication or distributed rate limiting is claimed.

Before adding any write path or real database connection, a private deployment must add authentication, authorization, request-rate controls, audit logging, least-privilege database roles, and narrowly scoped row-level security policies. See [deployment boundaries](docs/deployment.md).

`npm run secret:scan` inspects current source and **all Git objects**, including unreachable objects. It reports categories and locations, never matched values. Pattern scanning is a release guardrail, not proof of the absence of all possible secrets; allowlist review of deployed assets is also required.

## Reporting

Please open a private security advisory in the eventual GitHub repository. Do not place suspected credentials or personal data in a public issue.
