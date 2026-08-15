/**
 * NEXART HEALTH CHECK DASHBOARD
 * Page affichant les résultats du health check
 * Route: /health-check
 * 
 * Usage: Ouvre https://nexart.fr/health-check
 */

'use client';

import { useEffect, useState } from 'react';
import { RotateCw, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { colors } from '@/lib/design-tokens'

export default function HealthCheckDashboard() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchHealthCheck = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/health-check?full=true');
      const data = await response.json();
      setReport(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching health check:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthCheck();
  }, []);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHealthCheck();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading && !report) {
    return (
      <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', padding: '60px 20px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ animation: 'spin 2s linear infinite' }}>
            <RotateCw size={48} color={colors.coral.primary} />
          </div>
          <h1 style={{ marginTop: '20px', fontSize: '24px', fontWeight: 700 }}>
            Loading health check...
          </h1>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', padding: '60px 20px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.red.vivid }}>
            Failed to load health check
          </h1>
        </div>
      </div>
    );
  }

  const statusColor = {
    healthy: colors.green.primary,
    degraded: colors.status.pending.dot,
    unhealthy: colors.red.vivid,
  };

  const statusIcon = {
    healthy: <CheckCircle size={32} color={colors.green.primary} />,
    degraded: <AlertCircle size={32} color={colors.status.pending.dot} />,
    unhealthy: <XCircle size={32} color={colors.red.vivid} />,
  };

  const testCategoryColor = (category: string) => {
    switch (category) {
      case 'api':
        return colors.blue.medium;
      case 'pages':
        return colors.purple.primary;
      case 'security':
        return colors.fuchsia.primary;
      case 'database':
        return colors.blue.cyan;
      default:
        return colors.text.secondary;
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            padding: '30px',
            borderRadius: '8px',
            marginBottom: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            {statusIcon[report.status as keyof typeof statusIcon]}
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0', textTransform: 'capitalize' }}>
                System Status: <span style={{ color: statusColor[report.status as keyof typeof statusColor] }}>{report.status}</span>
              </h1>
              <p style={{ margin: '5px 0 0 0', color: colors.gray.midAlt, fontSize: '14px' }}>
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={fetchHealthCheck}
              style={{
                backgroundColor: colors.coral.primary,
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <RotateCw size={16} /> Refresh Now
            </button>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                backgroundColor: autoRefresh ? colors.green.primary : colors.border.default,
                color: autoRefresh ? 'white' : colors.gray.midAlt,
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {autoRefresh ? '✓ Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '8px', borderLeft: `4px solid ${colors.blue.medium}` }}>
            <div style={{ fontSize: '12px', color: colors.gray.midAlt, marginBottom: '10px' }}>Total Tests</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{report.summary.total}</div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '8px', borderLeft: `4px solid ${colors.green.primary}` }}>
            <div style={{ fontSize: '12px', color: colors.gray.midAlt, marginBottom: '10px' }}>Passed</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: colors.green.primary }}>{report.summary.passed}</div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '8px', borderLeft: `4px solid ${colors.red.vivid}` }}>
            <div style={{ fontSize: '12px', color: colors.gray.midAlt, marginBottom: '10px' }}>Failed</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: colors.red.vivid }}>{report.summary.failed}</div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '8px', borderLeft: `4px solid ${colors.purple.violet}` }}>
            <div style={{ fontSize: '12px', color: colors.gray.midAlt, marginBottom: '10px' }}>Duration</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{report.summary.duration}ms</div>
          </div>
        </div>

        {/* Test Results by Category */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          {Object.entries(report.results).map(([category, tests]: [string, any]) => {
            const passed = tests.filter((t: any) => t.passed).length;
            const failed = tests.filter((t: any) => !t.passed).length;

            return (
              <div
                key={category}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  padding: '20px',
                  borderRadius: '8px',
                  borderTop: `4px solid ${testCategoryColor(category)}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    margin: '0 0 15px 0',
                    textTransform: 'capitalize',
                    color: testCategoryColor(category),
                  }}
                >
                  {category}
                </h2>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: colors.gray.midAlt }}>Passed</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: colors.green.primary }}>{passed}/{tests.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: colors.gray.midAlt }}>Failed</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: colors.red.vivid }}>{failed}</div>
                  </div>
                </div>

                <div>
                  {tests.map((test: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px',
                        marginBottom: '8px',
                        borderRadius: '4px',
                        backgroundColor: test.passed ? colors.green.bgPale : colors.red.bg,
                        borderLeft: `3px solid ${test.passed ? colors.green.primary : colors.red.vivid}`,
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {test.passed ? (
                          <CheckCircle size={16} color={colors.green.primary} />
                        ) : (
                          <XCircle size={16} color={colors.red.vivid} />
                        )}
                        <span style={{ fontWeight: 600 }}>{test.name}</span>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }}>{test.duration}ms</span>
                      </div>
                      {test.error && (
                        <div style={{ marginTop: '5px', color: colors.red.vivid, fontSize: '12px' }}>
                          {test.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Critical Issues */}
        {report.critical_issues.length > 0 && (
          <div
            style={{
              backgroundColor: colors.red.bg,
              border: `1px solid ${colors.red.bgCa}`,
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: colors.red.vivid, margin: '0 0 15px 0' }}>
              🚨 Critical Issues
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {report.critical_issues.map((issue: string, idx: number) => (
                <li key={idx} style={{ color: colors.feedback.danger.solid, marginBottom: '8px' }}>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {report.warnings.length > 0 && (
          <div
            style={{
              backgroundColor: colors.red.bgFbeb,
              border: `1px solid ${colors.yellow.primary}`,
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: colors.feedback.warning.solid, margin: '0 0 15px 0' }}>
              ⚠️ Warnings
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {report.warnings.map((warning: string, idx: number) => (
                <li key={idx} style={{ color: colors.red.amber, marginBottom: '8px' }}>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <div
            style={{
              backgroundColor: colors.blue.skyPale,
              border: `1px solid ${colors.blue.skyLight}`,
              padding: '20px',
              borderRadius: '8px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: colors.blue.slate, margin: '0 0 15px 0' }}>
              💡 Recommendations
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {report.recommendations.map((rec: string, idx: number) => (
                <li key={idx} style={{ color: colors.blue.indigoDark, marginBottom: '8px' }}>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)', fontSize: '12px' }}>
          <p>Environment: <strong>{report.environment}</strong></p>
          <p>Check Timestamp: {report.timestamp}</p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
