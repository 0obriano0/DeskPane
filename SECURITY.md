# Security Policy

## Supported Versions

Security fixes are handled for the latest published version of DeskPane and the current `main` branch.

| Version | Supported |
|---------|-----------|
| Latest npm release | Yes |
| `main` branch | Yes |
| Older releases | Best effort |

## Reporting a Vulnerability

Please do not open a public GitHub issue for security vulnerabilities.

Preferred reporting path:

1. Use GitHub's private vulnerability reporting or security advisory flow if it is available for this repository.
2. If private reporting is not available, open a minimal public issue asking for a maintainer security contact. Do not include exploit details, reproduction code, tokens, private URLs, or sensitive information in that issue.

Please include:

- A clear description of the vulnerability.
- A minimal reproduction or proof of concept, if safe to share privately.
- Affected versions or commits.
- Browser, framework, and bundler details when relevant.
- Whether the issue requires user interaction.
- Any known workaround.

## Scope

Examples that are in scope:

- Cross-site scripting or unsafe HTML injection in DeskPane-managed UI.
- Escapes from isolated containers that allow interaction with unintended page areas.
- Vulnerabilities in published package artifacts.
- Security-sensitive behavior in runtime CSS or DOM injection.

Examples that are usually out of scope:

- Vulnerabilities caused solely by application-provided untrusted content.
- Browser extensions, local machine compromise, or malicious third-party scripts already running on the host page.
- General dependency advisories that do not affect the shipped DeskPane runtime.

## Disclosure

Maintainers will acknowledge valid reports as soon as practical, investigate the issue, and coordinate a fix and release. Please allow reasonable time for remediation before public disclosure.

