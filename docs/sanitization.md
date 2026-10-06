# Public export sanitization

This repository was reconstructed as a new, independent export. It does not inherit the private repository's Git history.

## Public-safe concepts retained

- domain entities and relationship semantics;
- deterministic metric and segmentation concepts;
- repository and API separation;
- parameterized data-access patterns;
- synthetic test strategies and evidence-oriented output design.

## Rewritten for public use

- the dataset was replaced by a small generated fixture with no contact fields;
- SQL was reduced to a portable schema with no hosted-project roles or identifiers;
- the runtime composition uses an in-memory repository and has no production dependency;
- the UI was narrowed to the explainable decision workflow and translated into three languages;
- documentation was rewritten to separate implemented, demo-only, excluded, and planned capabilities.

## Excluded

- all `.env` files other than the public-safe example containing only a local port and synthetic mode;
- hosted database URLs, role keys, database passwords, access tokens, and credentials;
- private deployment and hosting metadata;
- production authentication and privileged write paths;
- destructive import, reset, and administration routes;
- operational logs, analytics events, local build output, caches, and test artifacts;
- personal information, user email addresses, and non-synthetic business records;
- private prompts, hidden rules, and non-public operational documentation;
- the complete private Git history.

Automated scanning is a defense-in-depth check, not a guarantee. A human review remains required before publishing or accepting future contributions.
