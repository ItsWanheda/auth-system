# Security Policy

## Supported Versions

We actively maintain and provide security updates for the latest stable release of this project.

| Version | Supported |
|---------|-----------|
| Latest Stable | ✅ |
| Development (main) | ✅ |
| Older Releases | ❌ |

> Users are strongly encouraged to keep their installations up to date to receive the latest security fixes.

---

# Reporting a Vulnerability

The security of this project is taken seriously. If you discover a security vulnerability, please report it responsibly.

## Please Do Not

- Open a public GitHub Issue for security vulnerabilities.
- Disclose the vulnerability publicly before it has been reviewed and fixed.

## How to Report

Please report security issues by contacting the maintainer through one of the following methods:

- GitHub Security Advisories (preferred, if enabled)
- GitHub private communication
- Email (if a security contact is provided)

Include as much information as possible:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Proof-of-concept code (if applicable)
- Impact assessment
- Suggested mitigation (optional)
- Project version
- Operating system
- Node.js version

## Response Timeline

We aim to:

| Stage | Target Time |
|--------|-------------|
| Initial acknowledgement | Within 48 hours |
| Initial assessment | Within 5 business days |
| Status updates | At least once per week |
| Security fix | As soon as reasonably possible |

Response times may vary depending on the complexity and severity of the issue.

---

# Responsible Disclosure

We kindly ask that you:

- Allow reasonable time for the issue to be investigated and resolved.
- Avoid publicly disclosing the vulnerability until a fix has been released.
- Do not exploit vulnerabilities beyond what is necessary to demonstrate the issue.
- Avoid accessing, modifying, or deleting data that does not belong to you.

---

# Scope

This policy covers vulnerabilities related to:

- Authentication
- Authorization
- Session management
- JWT implementation
- Refresh token handling
- Password hashing
- Account recovery
- Input validation
- Rate limiting
- API security
- Access control
- Sensitive data exposure
- Dependency-related security issues

Out-of-scope reports include:

- General coding style issues
- Feature requests
- Missing best practices without demonstrable security impact
- Denial-of-Service attacks requiring unrealistic resources
- Social engineering attacks
- Vulnerabilities in third-party services outside this repository

---

# Security Best Practices

Users deploying this project should:

- Keep dependencies up to date.
- Use HTTPS in production.
- Store secrets in environment variables.
- Rotate JWT secrets regularly.
- Configure secure cookie settings when applicable.
- Enable proper rate limiting.
- Use strong password policies.
- Restrict CORS appropriately.
- Monitor authentication logs.
- Keep Node.js updated to a supported LTS version.

---

# Dependency Security

We regularly review project dependencies and encourage users to:

- Run `npm audit`
- Keep packages updated
- Review security advisories before upgrading dependencies

---

# Acknowledgements

We appreciate responsible disclosure from security researchers and community members who help improve the security of this project.

Thank you for helping keep this project and its users safe.
