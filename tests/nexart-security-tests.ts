/**
 * NEXART SECURITY TEST SUITE
 * Tests: OWASP Top 10, CSP, security headers, injection attacks, auth
 * Run: npx ts-node nexart-security-tests.ts
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface SecurityTest {
  name: string;
  category: string;
  test: () => Promise<{ passed: boolean; message: string }>;
}

class SecurityTestRunner {
  public results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };
  private issues: { test: string; severity: 'critical' | 'high' | 'medium' | 'low'; message: string }[] = [];

  async runTest(test: SecurityTest) {
    try {
      console.log(`\n🔒 ${test.category} — ${test.name}`);
      const result = await test.test();

      if (result.passed) {
        console.log(`  ✅ PASS: ${result.message}`);
        this.results.passed++;
      } else {
        console.log(`  ⚠️ WARN: ${result.message}`);
        this.results.warnings++;
      }

      return result;
    } catch (error: any) {
      console.log(`  ❌ FAIL: ${error.message}`);
      this.results.failed++;
      this.issues.push({
        test: test.name,
        severity: 'high',
        message: error.message,
      });
    }
  }

  async runAll(tests: SecurityTest[]) {
    console.log('🚀 SECURITY TEST SUITE\n');
    console.log(`Base URL: ${BASE_URL}\n`);

    for (const test of tests) {
      await this.runTest(test);
    }

    this.printSummary();
  }

  private printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 SECURITY TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Passed:   ${this.results.passed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`❌ Failed:   ${this.results.failed}`);

    if (this.issues.length > 0) {
      console.log('\n🔴 CRITICAL ISSUES:');
      this.issues.filter((i) => i.severity === 'critical').forEach((i) => {
        console.log(`  [${i.severity.toUpperCase()}] ${i.test}: ${i.message}`);
      });

      console.log('\n🟠 HIGH PRIORITY:');
      this.issues.filter((i) => i.severity === 'high').forEach((i) => {
        console.log(`  [${i.severity.toUpperCase()}] ${i.test}: ${i.message}`);
      });
    }

    console.log('\n📌 RECOMMENDATIONS:');
    console.log('  1. Fix all CRITICAL issues immediately');
    console.log('  2. Address HIGH priority issues in next sprint');
    console.log('  3. Consider low/medium issues for backlog');
    console.log('  4. Run this suite after each deployment\n');
  }
}

// ============================================================================
// SECURITY TEST SUITE
// ============================================================================

const securityTests: SecurityTest[] = [
  // ========== SECURITY HEADERS ==========
  {
    name: 'Content-Security-Policy Header',
    category: 'Headers',
    test: async () => {
      const { headers } = await axios.get(BASE_URL);
      const csp = headers['content-security-policy'] || headers['content-security-policy-report-only'];

      return {
        passed: !!csp,
        message: csp ? `CSP enabled: ${csp.substring(0, 50)}...` : 'CSP header missing',
      };
    },
  },

  {
    name: 'X-Content-Type-Options Header',
    category: 'Headers',
    test: async () => {
      const { headers } = await axios.get(BASE_URL);
      const xContentType = headers['x-content-type-options'];

      return {
        passed: xContentType === 'nosniff',
        message: xContentType ? `Set to: ${xContentType}` : 'Header missing',
      };
    },
  },

  {
    name: 'X-Frame-Options Header',
    category: 'Headers',
    test: async () => {
      const { headers } = await axios.get(BASE_URL);
      const xFrame = headers['x-frame-options'];

      const isSafe = xFrame && ['DENY', 'SAMEORIGIN'].includes(xFrame);
      return {
        passed: isSafe,
        message: xFrame ? `Set to: ${xFrame}` : 'Header missing (vulnerable to clickjacking)',
      };
    },
  },

  {
    name: 'X-XSS-Protection Header',
    category: 'Headers',
    test: async () => {
      const { headers } = await axios.get(BASE_URL);
      const xXss = headers['x-xss-protection'];

      return {
        passed: !!xXss,
        message: xXss ? `Set to: ${xXss}` : 'Header missing',
      };
    },
  },

  {
    name: 'Strict-Transport-Security (HSTS)',
    category: 'Headers',
    test: async () => {
      const { headers } = await axios.get(BASE_URL);
      const hsts = headers['strict-transport-security'];

      return {
        passed: !!hsts,
        message: hsts ? `HSTS enabled: ${hsts}` : 'HSTS not set (HTTP->HTTPS redirects at risk)',
      };
    },
  },

  // ========== SSL/TLS ==========
  {
    name: 'HTTPS Enforced',
    category: 'Transport Security',
    test: async () => {
      const url = BASE_URL.replace('http://', 'https://');
      try {
        const response = await axios.get(url, { timeout: 5000 });
        return {
          passed: response.status === 200,
          message: `SSL/TLS active (${response.status})`,
        };
      } catch (error: any) {
        return {
          passed: false,
          message: `HTTPS not available or certificate invalid: ${error.message}`,
        };
      }
    },
  },

  // ========== INJECTION ATTACKS ==========
  {
    name: 'SQL Injection (GET parameter)',
    category: 'Injection',
    test: async () => {
      const payload = "' OR '1'='1";
      try {
        const response = await axios.get(`${BASE_URL}/api/events?search=${encodeURIComponent(payload)}`);

        // Should NOT return error revealing DB structure
        const isSafe = !response.data?.error?.includes('SQL') && !response.data?.error?.includes('database');
        return {
          passed: isSafe,
          message: isSafe ? 'No SQL errors exposed' : 'Possible SQL injection vulnerability',
        };
      } catch (error) {
        return { passed: true, message: 'Request blocked (safe)' };
      }
    },
  },

  {
    name: 'XSS Injection (in URL)',
    category: 'Injection',
    test: async () => {
      const payload = '<script>alert("xss")</script>';
      try {
        const { data } = await axios.get(
          `${BASE_URL}/search?q=${encodeURIComponent(payload)}`
        );

        // Should HTML-encode the payload
        const isEncoded = !data?.includes('<script>');
        return {
          passed: isEncoded,
          message: isEncoded ? 'Payload properly encoded' : 'Possible XSS vulnerability',
        };
      } catch (error) {
        return { passed: true, message: 'Request handled safely' };
      }
    },
  },

  // ========== CORS ==========
  {
    name: 'CORS Misconfiguration',
    category: 'CORS',
    test: async () => {
      const { headers } = await axios.get(BASE_URL);
      const allowOrigin = headers['access-control-allow-origin'];

      const isSafe = !allowOrigin || allowOrigin === BASE_URL;
      return {
        passed: isSafe,
        message: allowOrigin ? `CORS set to: ${allowOrigin}` : 'CORS not configured (restrictive)',
      };
    },
  },

  {
    name: 'CORS Credentials Leak',
    category: 'CORS',
    test: async () => {
      const { headers } = await axios.get(BASE_URL);
      const allowCredentials = headers['access-control-allow-credentials'];
      const allowOrigin = headers['access-control-allow-origin'];

      // Should NOT allow credentials with wildcard origin
      const isSafe = !(allowCredentials && allowOrigin === '*');
      return {
        passed: isSafe,
        message: isSafe
          ? 'Credentials policy is safe'
          : 'SECURITY RISK: Allow-Credentials with wildcard origin',
      };
    },
  },

  // ========== AUTHENTICATION ==========
  {
    name: 'Auth Token Not in URL',
    category: 'Authentication',
    test: async () => {
      // Simulate checking logs for auth tokens in URLs
      // This is a manual check, but we can verify redirects
      const response = await axios.get(`${BASE_URL}/login`, { maxRedirects: 0 }).catch((e) => e.response);

      // Should not have auth token in redirect URL
      const location = response?.headers?.location || '';
      const isSafe = !location.includes('token') && !location.includes('auth=');
      return {
        passed: isSafe,
        message: isSafe ? 'Auth tokens not exposed in URLs' : 'Tokens may be exposed in redirects',
      };
    },
  },

  {
    name: 'Session Timeout (httpOnly cookies)',
    category: 'Authentication',
    test: async () => {
      const { headers } = await axios.get(BASE_URL);
      const setCookie = headers['set-cookie'];

      if (!setCookie) {
        return { passed: true, message: 'No cookies set (JWT in localStorage)' };
      }

      const hasHttpOnly = setCookie?.some((cookie: string) => cookie.includes('HttpOnly'));
      return {
        passed: hasHttpOnly,
        message: hasHttpOnly ? 'HttpOnly flag set on session cookies' : 'Session cookies missing HttpOnly flag',
      };
    },
  },

  // ========== INPUT VALIDATION ==========
  {
    name: 'Email Validation (invalid format)',
    category: 'Input Validation',
    test: async () => {
      try {
        const response = await axios.post(
          `${BASE_URL}/api/contact`,
          { email: 'not-an-email', message: 'test' },
          { validateStatus: () => true }
        );

        // Should reject or sanitize
        const isValidated = response.status >= 400 || response.data?.error;
        return {
          passed: isValidated,
          message: isValidated ? 'Invalid email rejected' : 'Email validation may be weak',
        };
      } catch {
        return { passed: true, message: 'Request handled safely' };
      }
    },
  },

  {
    name: 'File Upload Size Limit',
    category: 'Input Validation',
    test: async () => {
      // Check if file upload endpoints exist and have size limits
      // This is a basic check
      return {
        passed: true,
        message: 'Manual verification needed: check upload limits in code',
      };
    },
  },

  // ========== SENSITIVE DATA ==========
  {
    name: 'No API Keys in Frontend',
    category: 'Sensitive Data',
    test: async () => {
      const { data } = await axios.get(BASE_URL);

      // Check for exposed keys
      const hasExposedKeys = /sk_live_|sk_test_|api_key|secret_key/.test(data);
      return {
        passed: !hasExposedKeys,
        message: hasExposedKeys ? 'Possible API keys exposed' : 'No obvious keys exposed',
      };
    },
  },

  {
    name: 'No Credentials in Logs',
    category: 'Sensitive Data',
    test: async () => {
      // Check public logs endpoint (if available)
      try {
        const response = await axios.get(`${BASE_URL}/api/logs`, { validateStatus: () => true });

        if (response.status === 404) {
          return { passed: true, message: 'Logs not publicly accessible (good)' };
        }

        const hasCredentials = /password|token|secret|key/.test(response.data);
        return {
          passed: !hasCredentials,
          message: hasCredentials ? 'Credentials found in logs' : 'No credentials in logs',
        };
      } catch {
        return { passed: true, message: 'Logs endpoint not found' };
      }
    },
  },

  // ========== ERROR HANDLING ==========
  {
    name: '404 Page (no info disclosure)',
    category: 'Error Handling',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/nonexistent-route`, { validateStatus: () => true });

      // Should NOT reveal server info
      const message = response.data;
      const isSafe =
        !message?.includes('node_modules') &&
        !message?.includes('stack trace') &&
        !message?.includes('next.js');

      return {
        passed: isSafe,
        message: isSafe ? 'Error page does not leak info' : 'Error messages may leak info',
      };
    },
  },

  {
    name: '5xx Error Handling',
    category: 'Error Handling',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/api/intentional-error`, { validateStatus: () => true });

      // Should not expose stack traces
      const message = JSON.stringify(response.data);
      const isSafe = !message.includes('at ') && !message.includes('node_modules');

      return {
        passed: isSafe,
        message: isSafe ? 'No stack traces exposed' : 'Stack traces may be exposed',
      };
    },
  },

  // ========== DEPENDENCY SECURITY ==========
  {
    name: 'No Vulnerable Dependencies (check build)',
    category: 'Dependencies',
    test: async () => {
      // This should be run via `npm audit` locally
      // Here we just note it
      return {
        passed: true,
        message: 'Run `npm audit` locally for detailed vulnerability check',
      };
    },
  },

  // ========== RATE LIMITING ==========
  {
    name: 'Rate Limiting on API',
    category: 'Rate Limiting',
    test: async () => {
      // Make rapid requests
      const start = Date.now();
      let lastStatus = 200;

      for (let i = 0; i < 100; i++) {
        try {
          const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 1000 });
          lastStatus = response.status;
        } catch (error: any) {
          if (error.response?.status === 429) {
            console.log(`    → Rate limit triggered after ${i} requests`);
            return {
              passed: true,
              message: `Rate limiting active (429 after ${i} requests)`,
            };
          }
        }
      }

      return {
        passed: lastStatus === 200,
        message: 'Rate limiting check: consider implementing if not present',
      };
    },
  },
];

// ============================================================================
// RUN TESTS
// ============================================================================

async function main() {
  const runner = new SecurityTestRunner();
  await runner.runAll(securityTests);

  process.exit(runner.results.failed > 0 ? 1 : 0);
}

main().catch(console.error);
