# Contributing Guide

First off, thank you for considering contributing to this project! ❤️

Whether you're fixing a bug, improving documentation, adding a feature, or suggesting an idea, your contributions are greatly appreciated.

---

# Table of Contents

- Getting Started
- Development Setup
- Project Structure
- Coding Guidelines
- Commit Messages
- Pull Requests
- Reporting Bugs
- Suggesting Features
- Security
- Questions

---

# Getting Started

Before contributing, please:

1. Read the README.
2. Review the Code of Conduct.
3. Check existing Issues and Pull Requests.
4. Create an Issue before starting major changes.

---

# Development Setup

## Prerequisites

- Node.js (LTS recommended)
- npm
- Git

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/your-auth-system.git
```

Go to the project directory:

```bash
cd your-auth-system
```

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Fill in the required environment variables.

Start the development server:

```bash
npm run dev
```

---

# Project Structure

```
auth-system/
├── prisma/
│ └── schema.prisma # Database schema
├── scripts/
│ └── fix-imports.cjs # One-shot tool to convert @/ imports to relative
├── src/
│ ├── auth/ # Auth module
│ │ ├── auth.controller.ts
│ │ ├── auth.routes.ts
│ │ └── auth.service.ts
│ ├── users/ # Users module
│ │ ├── users.controller.ts
│ │ ├── users.routes.ts
│ │ └── users.service.ts
│ ├── middleware/
│ │ ├── auth.middleware.ts # JWT verification
│ │ ├── csrf.middleware.ts # Double-submit CSRF
│ │ ├── error.middleware.ts # Centralized errors
│ │ ├── rate-limit.middleware.ts
│ │ └── validate.middleware.ts # Zod validation
│ ├── services/
│ │ ├── audit.service.ts # Audit logs
│ │ ├── email.service.ts # Email (mock — pluggable)
│ │ └── token.service.ts # JWT + rotation logic
│ ├── repositories/ # Data access layer
│ │ ├── audit-log.repository.ts
│ │ ├── email-verification-token.repository.ts
│ │ ├── password-reset-token.repository.ts
│ │ ├── refresh-token.repository.ts
│ │ └── user.repository.ts
│ ├── routes/
│ │ └── index.ts # Route aggregator
│ ├── validators/ # Zod schemas
│ │ ├── auth.validator.ts
│ │ └── user.validator.ts
│ ├── utils/
│ │ ├── async-handler.ts
│ │ ├── cookies.ts
│ │ ├── crypto.ts
│ │ ├── errors.ts # Custom error hierarchy
│ │ ├── jwt.ts
│ │ └── password.ts # Argon2id wrappers
│ ├── config/
│ │ ├── env.ts # Env validation (Zod)
│ │ ├── logger.ts # Pino logger
│ │ └── swagger.ts # OpenAPI spec
│ ├── prisma/
│ │ └── prisma.client.ts # Prisma + SQLite PRAGMAs
│ ├── types/ # Shared TypeScript types
│ ├── app.ts # Express app factory
│ └── server.ts # Server entry point
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── docker-compose.yml
├── docker-entrypoint.sh
├── Dockerfile
├── package.json
├── postman-collection.json
├── README.md
└── tsconfig.json
```

The exact structure may evolve as the project grows.

---

# Coding Guidelines

Please follow these principles:

- Write clean, readable code.
- Use meaningful variable and function names.
- Keep functions focused on a single responsibility.
- Prefer small, reusable modules.
- Avoid unnecessary complexity.
- Remove unused code before submitting.
- Follow the existing code style.
- Add comments only when necessary.

---

# Code Style

Please ensure that your code:

- Passes all linting checks.
- Builds successfully.
- Does not introduce unnecessary dependencies.
- Includes appropriate documentation when needed.

---

# Commit Messages

We recommend following the Conventional Commits specification.

Examples:

```text
feat: add email verification
fix: resolve JWT refresh bug
docs: update README
refactor: simplify auth middleware
test: add login endpoint tests
chore: update dependencies
```

---

# Pull Requests

Before opening a Pull Request, please ensure:

- The project builds successfully.
- All tests pass.
- New features include appropriate tests where possible.
- Documentation is updated if necessary.
- Your branch is up to date with the latest main branch.
- The PR has a clear title and description.

Small, focused pull requests are preferred over large ones.

---

# Reporting Bugs

When opening a bug report, include:

- Project version
- Node.js version
- Operating system
- Steps to reproduce
- Expected behavior
- Actual behavior
- Error logs (if available)
- Screenshots (if applicable)

---

# Feature Requests

Feature requests are welcome.

Please include:

- The problem you're trying to solve
- Your proposed solution
- Possible alternatives
- Additional context

---

# Security Issues

Please **do not** report security vulnerabilities through public GitHub Issues.

Instead, follow the instructions in the project's **SECURITY.md** file.

---

# Documentation Contributions

Documentation improvements are always appreciated.

Examples include:

- Fixing typos
- Improving explanations
- Adding examples
- Clarifying setup instructions
- Updating outdated information

---

# Questions

If you have questions before contributing, feel free to open a GitHub Discussion or Issue.

---

# Thank You

Every contribution—big or small—helps improve this project.

Thank you for helping make this authentication system better for everyone! 🚀
