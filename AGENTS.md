# Agent Rules

- Keep changes scoped to the user request. Do not refactor, redesign, or touch unrelated files.
- Preserve working behaviour unless the user explicitly asks to change it.
- Reuse existing services, DTOs, validators, helpers, components, and test utilities where suitable before creating new ones.
- Do not add abstractions, files, endpoints, components, or packages unless the requested change genuinely requires them.
- Do not invent business rules, delivery promises, payment behaviour, certifications, or policies.
- Limit new dependencies. Add one only when it is necessary and clearly justified.
- Report uncertainty clearly. Label unverified assumptions instead of presenting them as facts.
- Run checks relevant to the change size and risk when implementation is requested.
- Ask for approval before destructive, risky, credential, deployment, database, or production actions.