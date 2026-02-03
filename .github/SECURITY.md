# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. **Do NOT** open a public issue

Security vulnerabilities should be reported privately to protect users.

### 2. Report the vulnerability

Please report security vulnerabilities through [GitHub Security Advisories](https://github.com/marcinkantyka/pull-request-reviewer-ai/security/advisories/new) or by opening a private security issue.

Include the following information:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### 3. Response timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Resolution**: Depends on severity and complexity

### 4. Disclosure policy

- We will acknowledge receipt of your report
- We will keep you informed of the progress
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- We will coordinate public disclosure after a fix is available

## Security Best Practices

This tool is designed with security in mind:

### Network Security

- **Localhost-only connections**: The tool enforces localhost-only connections to LLM providers
- **No external data transmission**: All code analysis happens locally
- **Network validation**: Built-in validation prevents connections to external hosts

### Code Review

- All code changes are reviewed before merging
- Automated security scanning in CI/CD
- Dependency updates are regularly reviewed

### Reporting Security Issues

When reporting security issues, please:

1. **Do not** disclose the vulnerability publicly
2. Provide detailed information about the vulnerability
3. Allow time for the issue to be addressed before disclosure
4. Follow responsible disclosure practices

## Security Features

### Built-in Protections

- Network endpoint validation (localhost/127.0.0.1 only)
- Input validation and sanitization
- Secure file handling
- Error handling that doesn't leak sensitive information

### Recommendations for Users

- Keep the tool updated to the latest version
- Review configuration files for sensitive information
- Use environment variables for sensitive configuration
- Run in isolated environments when possible

## Known Security Considerations

### LLM Provider Security

- The tool connects to local LLM providers (Ollama, vLLM, etc.)
- Ensure your LLM server is properly secured
- Use firewall rules to restrict access to LLM endpoints
- Consider running LLM servers in isolated networks

### Configuration Security

- Configuration files may contain endpoint URLs
- Use environment variables for sensitive configuration
- Don't commit configuration files with sensitive data to version control

### Docker Security

- Docker images are built from trusted base images
- Containers run with minimal privileges
- Network isolation is enforced in docker-compose configurations

## Security Updates

Security updates will be:

- Released as patch versions (e.g., 1.0.0 → 1.0.1)
- Documented in release notes
- Tagged with security labels on GitHub
- Announced via GitHub security advisories for critical issues

## Thank You

Thank you for helping keep PR Review CLI secure! Security researchers and contributors who responsibly disclose vulnerabilities are greatly appreciated.
