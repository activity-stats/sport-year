# Security Policy

## 🔒 Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it privately.

**Do NOT create a public GitHub issue for security vulnerabilities.**

### How to Report

1. **Email**: Send details to the repository maintainers
2. **GitHub Security Advisory**: Use the [Security tab](https://github.com/activity-stats/sport-year/security/advisories/new) to create a private advisory

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### Response Time

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Depends on severity

## 🛡️ Security Measures

### Application Security

**Data Storage**
- All credentials stored locally in browser (localStorage)
- No data sent to external servers except Strava API
- No server-side storage or processing

**Authentication**
- OAuth 2.0 flow with Strava
- Tokens stored securely in browser
- No password storage
- Automatic token refresh

**API Communication**
- HTTPS only for Strava API calls
- No proxies or intermediaries
- Direct client-to-Strava communication

### Development Security

**Dependencies**
- Regular `npm audit` checks
- Automated security scanning (CodeQL)
- Dependency review on PRs
- Dependabot alerts enabled

**CI/CD Security**
- Actions locked to commit SHA
- Minimal permissions (principle of least privilege)
- No credential persistence
- Script execution blocked (`npm ci --ignore-scripts`)

**Code Quality**
- TypeScript strict mode
- ESLint security rules
- Pre-commit hooks
- 100% test coverage on critical paths

## 🔐 For Users

### Protecting Your Credentials

1. **Strava API Setup**
   - Create your own Strava app
   - Don't share Client ID/Secret
   - Use domain-specific callback URLs

2. **Browser Security**
   - Keep browser updated
   - Use HTTPS when hosting
   - Clear browser data if using shared computer

3. **Token Security**
   - Tokens are browser-specific
   - Can be cleared via settings
   - Expire after 6 hours (Strava default)

### What We DON'T Do

- ❌ Store credentials on servers
- ❌ Send data to third parties (except Strava)
- ❌ Track user behavior
- ❌ Collect analytics
- ❌ Use cookies for tracking

### What We DO

- ✅ Store tokens in localStorage (browser only)
- ✅ Make direct API calls to Strava
- ✅ Validate all inputs
- ✅ Use HTTPS for API calls
- ✅ Follow OWASP best practices

## 🚨 Known Limitations

1. **localStorage Security**
   - Accessible via browser console
   - Vulnerable to XSS (we sanitize inputs)
   - Cleared when browser data is cleared

2. **No Server-Side Validation**
   - Client-side app only
   - No backend verification
   - Trust Strava API responses

3. **Browser Dependencies**
   - Requires modern browser
   - localStorage must be enabled
   - JavaScript must be enabled

## 🔄 Security Updates

- Security patches released ASAP
- Users notified via GitHub releases
- Critical issues announced immediately
- Regular dependency updates

## 📋 Security Checklist for Contributors

- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all user data
- [ ] Proper error handling (no info leakage)
- [ ] TypeScript for type safety
- [ ] Tests cover security-critical paths
- [ ] Dependencies are up to date
- [ ] No `eval()` or dangerous functions
- [ ] HTTPS for all external calls

## 🏆 Security Best Practices

### For Developers

1. **Never commit secrets**
   - Use `.env` files (git ignored)
   - Use environment variables
   - Check before committing

2. **Validate inputs**
   - Sanitize user input
   - Validate API responses
   - Use TypeScript types

3. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Review Dependabot alerts
   - Update promptly

4. **Follow secure coding**
   - Use parameterized queries (if DB added)
   - Avoid `innerHTML` / use `textContent`
   - Sanitize URLs
   - Use Content Security Policy

### For Hosting

If self-hosting:

1. **Use HTTPS** - Always, no exceptions
2. **Set security headers** - CSP, HSTS, X-Frame-Options
3. **Keep server updated** - OS and software patches
4. **Configure firewall** - Restrict access
5. **Monitor logs** - Watch for suspicious activity

Example security headers:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Strava API Security](https://developers.strava.com/docs/authentication/)
- [OAuth 2.0 Security](https://oauth.net/2/)
- [GitHub Security](https://docs.github.com/en/code-security)

## 🆘 Support

For security questions (non-vulnerabilities):
- Open a GitHub Discussion
- Check existing security documentation
- Review Strava API docs

Thank you for helping keep Sport Year secure! 🙏
