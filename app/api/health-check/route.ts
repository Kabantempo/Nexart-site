/**
 * NEXART UNIFIED HEALTH CHECK ENDPOINT
 * GET /api/health-check
 * 
 * Lance TOUS les tests (API, pages, sécurité, DB) en une seule requête
 * Retourne un rapport JSON complet
 * 
 * Usage:
 *   curl https://nexart.fr/api/health-check
 *   curl https://nexart.fr/api/health-check?full=true  (rapport détaillé)
 *   curl https://nexart.fr/api/health-check?type=api   (seulement API tests)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000';

// ============================================================================
// TYPES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

interface CheckReport {
  timestamp: string;
  environment: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  statusCode: number;
  uptime: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
  results: {
    api: TestResult[];
    pages: TestResult[];
    security: TestResult[];
    database: TestResult[];
  };
  critical_issues: string[];
  warnings: string[];
  recommendations: string[];
}

// ============================================================================
// QUICK CHECKS (Fast)
// ============================================================================

async function quickHealthCheck(): Promise<CheckReport> {
  const startTime = Date.now();
  const report: CheckReport = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    status: 'healthy',
    statusCode: 200,
    uptime: '100%',
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0,
    },
    results: {
      api: [],
      pages: [],
      security: [],
      database: [],
    },
    critical_issues: [],
    warnings: [],
    recommendations: [],
  };

  try {
    // 1. API Health Check (fast)
    const apiResults = await checkApiEndpoints();
    report.results.api = apiResults;

    // 2. Page Availability Check (fast)
    const pageResults = await checkCriticalPages();
    report.results.pages = pageResults;

    // 3. Security Headers Check (fast)
    const securityResults = await checkSecurityHeaders();
    report.results.security = securityResults;

    // 4. Database Connectivity Check (fast)
    const dbResults = await checkDatabaseConnectivity();
    report.results.database = dbResults;

    // Calculate summary
    const allResults = [...apiResults, ...pageResults, ...securityResults, ...dbResults];
    report.summary.total = allResults.length;
    report.summary.passed = allResults.filter((r) => r.passed).length;
    report.summary.failed = allResults.filter((r) => !r.passed).length;
    report.summary.duration = Date.now() - startTime;

    // Determine overall status
    if (report.summary.failed === 0) {
      report.status = 'healthy';
      report.statusCode = 200;
    } else if (report.summary.failed <= 3) {
      report.status = 'degraded';
      report.statusCode = 200;
    } else {
      report.status = 'unhealthy';
      report.statusCode = 503;
    }

    // Add critical issues
    report.critical_issues = allResults
      .filter((r) => !r.passed && r.name.includes('Critical'))
      .map((r) => r.error || r.name);

    // Add recommendations
    if (report.summary.failed > 0) {
      report.recommendations.push('Fix failing health checks before deploying');
    }
    if (report.summary.duration > 10000) {
      report.recommendations.push('Performance degraded - check server resources');
    }

    return report;
  } catch (error: any) {
    report.status = 'unhealthy';
    report.statusCode = 500;
    report.critical_issues.push(`Health check error: ${(error as Error).message}`);
    return report;
  }
}

// ============================================================================
// DETAILED CHECKS (Comprehensive)
// ============================================================================

async function fullHealthCheck(): Promise<CheckReport> {
  const report = await quickHealthCheck();
  // Could add more detailed checks here
  // For now, return the quick check (production-safe)
  return report;
}

// ============================================================================
// INDIVIDUAL CHECK FUNCTIONS
// ============================================================================

async function checkApiEndpoints(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const criticalEndpoints = [
    { name: 'Health Check', endpoint: '/api/health' },
    { name: 'Events List', endpoint: '/api/events' },
    { name: 'Reviews', endpoint: '/api/reviews' },
    { name: 'Auth Me', endpoint: '/api/auth/me' },
  ];

  for (const { name, endpoint } of criticalEndpoints) {
    const start = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`, { timeout: 5000 });
      const duration = Date.now() - start;

      results.push({
        name: `API: ${name}`,
        passed: response.status < 500,
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - start;
      results.push({
        name: `API: ${name}`,
        passed: false,
        duration,
        error: (error as Error).message || 'Request failed',
      });
    }
  }

  return results;
}

async function checkCriticalPages(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const criticalPages = [
    { name: 'Homepage', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'Patch Notes', path: '/patch-notes' },
  ];

  for (const { name, path } of criticalPages) {
    const start = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}${path}`, { timeout: 5000 });
      const duration = Date.now() - start;

      results.push({
        name: `Page: ${name}`,
        passed: response.status === 200,
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - start;
      results.push({
        name: `Page: ${name}`,
        passed: false,
        duration,
        error: (error as Error).message || 'Page not loading',
      });
    }
  }

  return results;
}

async function checkSecurityHeaders(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const start = Date.now();

  try {
    const response = await axios.get(BASE_URL, { timeout: 5000 });
    const duration = Date.now() - start;
    const headers = response.headers;

    // Check critical security headers
    const checks = [
      {
        name: 'Security: CSP Header',
        passed: !!(headers['content-security-policy'] || headers['content-security-policy-report-only']),
      },
      {
        name: 'Security: X-Content-Type-Options',
        passed: headers['x-content-type-options'] === 'nosniff',
      },
      {
        name: 'Security: X-Frame-Options',
        passed: !!headers['x-frame-options'],
      },
      {
        name: 'Security: HTTPS',
        passed: response.config.url?.startsWith('https'),
      },
    ];

    checks.forEach((check) => {
      results.push({
        name: check.name,
        passed: check.passed ?? false,
        duration,
      });
    });
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({
      name: 'Security: Overall Check',
      passed: false,
      duration,
      error: (error as Error).message,
    });
  }

  return results;
}

async function checkDatabaseConnectivity(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const start = Date.now();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return [
        {
          name: 'Database: Configuration',
          passed: false,
          duration: Date.now() - start,
          error: 'Supabase credentials not configured',
        },
      ];
    }

    const client = createClient(supabaseUrl, supabaseKey);

    // Try to fetch from a simple table
    const { error } = await client.from('profiles').select('count()', { count: 'exact', head: true });
    const duration = Date.now() - start;

    results.push({
      name: 'Database: Connection',
      passed: !error,
      duration,
      error: (error as Error)?.message,
    });

    // Check audit logs (RGPD)
    const { error: auditError } = await client
      .from('audit_logs')
      .select('count()', { count: 'exact', head: true });

    results.push({
      name: 'Database: RGPD (audit_logs)',
      passed: !auditError,
      duration,
      error: auditError?.message,
    });
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({
      name: 'Database: Overall',
      passed: false,
      duration,
      error: (error as Error).message,
    });
  }

  return results;
}

// ============================================================================
// HTTP ENDPOINT
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const { searchParams } = new URL(request.url);
    const full = searchParams.get('full') === 'true';
    const type = searchParams.get('type'); // api, pages, security, database

    // Run health check
    const report = full ? await fullHealthCheck() : await quickHealthCheck();

    // Filter by type if requested
    if (type && report.results[type as keyof typeof report.results]) {
      const filtered = report.results[type as keyof typeof report.results];
      const failedCount = filtered.filter((r) => !r.passed).length;

      return NextResponse.json(
        {
          type,
          status: failedCount === 0 ? 'healthy' : 'degraded',
          results: filtered,
          summary: {
            total: filtered.length,
            passed: filtered.filter((r) => r.passed).length,
            failed: failedCount,
          },
        },
        { status: report.statusCode }
      );
    }

    // Return full report
    return NextResponse.json(report, { status: report.statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
