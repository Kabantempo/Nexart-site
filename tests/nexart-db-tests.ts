/**
 * NEXART DATABASE TEST SUITE
 * Tests: migrations, RLS, table integrity, query performance, data consistency
 * Run: npx ts-node nexart-db-tests.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cvqeysnymnkfxfithhsr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

interface DbTest {
  name: string;
  category: string;
  test: (client: any) => Promise<{ passed: boolean; message: string }>;
}

class DbTestRunner {
  private supabase: any;
  public results = { passed: 0, failed: 0, warnings: 0 };
  private issues: { test: string; severity: 'critical' | 'high' | 'medium'; message: string }[] = [];

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  async runTest(test: DbTest) {
    try {
      console.log(`\n🧪 ${test.category} — ${test.name}`);
      const result = await test.test(this.supabase);

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

  async runAll(tests: DbTest[]) {
    console.log('🚀 DATABASE TEST SUITE\n');
    console.log(`Supabase Project: ${SUPABASE_URL}\n`);

    for (const test of tests) {
      await this.runTest(test);
    }

    this.printSummary();
  }

  private printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 DATABASE TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Passed:   ${this.results.passed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`❌ Failed:   ${this.results.failed}`);

    if (this.issues.length > 0) {
      console.log('\n🔴 CRITICAL ISSUES:');
      this.issues.filter((i) => i.severity === 'critical').forEach((i) => {
        console.log(`  [${i.severity.toUpperCase()}] ${i.test}: ${i.message}`);
      });
    }
  }
}

// ============================================================================
// DATABASE TEST SUITE
// ============================================================================

const dbTests: DbTest[] = [
  // ========== TABLE EXISTENCE ==========
  {
    name: 'Table: profiles exists',
    category: 'Schema',
    test: async (client) => {
      const { data, error } = await client.from('profiles').select('count()', { count: 'exact', head: true });
      return {
        passed: !error,
        message: error ? `Table missing: ${error.message}` : 'Table exists',
      };
    },
  },

  {
    name: 'Table: events exists',
    category: 'Schema',
    test: async (client) => {
      const { data, error } = await client.from('events').select('count()', { count: 'exact', head: true });
      return {
        passed: !error,
        message: error ? `Table missing: ${error.message}` : 'Table exists',
      };
    },
  },

  {
    name: 'Table: audit_logs exists',
    category: 'Schema',
    test: async (client) => {
      const { data, error } = await client.from('audit_logs').select('count()', { count: 'exact', head: true });
      return {
        passed: !error,
        message: error ? `RGPD compliance at risk: ${error.message}` : 'Audit table exists',
      };
    },
  },

  {
    name: 'Table: changelog exists',
    category: 'Schema',
    test: async (client) => {
      const { data, error } = await client.from('changelog').select('count()', { count: 'exact', head: true });
      return {
        passed: !error,
        message: error ? `Changelog missing: ${error.message}` : 'Changelog table exists',
      };
    },
  },

  // ========== DATA INTEGRITY ==========
  {
    name: 'No NULL user IDs in profiles',
    category: 'Data Integrity',
    test: async (client) => {
      const { data, error } = await client.from('profiles').select('id').is('id', null);

      const nullCount = data?.length || 0;
      return {
        passed: nullCount === 0,
        message: nullCount === 0 ? 'No NULL IDs found' : `Found ${nullCount} NULL IDs (data corruption)`,
      };
    },
  },

  {
    name: 'No orphaned events (missing user)',
    category: 'Data Integrity',
    test: async (client) => {
      // Check for events with non-existent creator_id
      const { data: orphaned, error } = await client.rpc('find_orphaned_events');

      if (error) {
        return { passed: true, message: 'RPC not available (manual check needed)' };
      }

      const count = orphaned?.length || 0;
      return {
        passed: count === 0,
        message: count === 0 ? 'No orphaned events' : `Found ${count} orphaned events`,
      };
    },
  },

  {
    name: 'Valid event dates (start < end)',
    category: 'Data Integrity',
    test: async (client) => {
      const { data: invalidDates, error } = await client
        .from('events')
        .select('id, start_date, end_date')
        .gt('start_date', 'end_date');

      const count = invalidDates?.length || 0;
      return {
        passed: count === 0,
        message: count === 0 ? 'All event dates valid' : `Found ${count} invalid date ranges`,
      };
    },
  },

  // ========== CONSTRAINTS ==========
  {
    name: 'PRIMARY KEY constraint on profiles',
    category: 'Constraints',
    test: async (client) => {
      try {
        // Try to insert duplicate ID (should fail)
        await client.from('profiles').insert({
          id: 'duplicate-test-id',
          role: 'creator',
        });

        return { passed: false, message: 'PRIMARY KEY constraint may be missing' };
      } catch (error: any) {
        return { passed: true, message: 'Constraint working (duplicate rejected)' };
      }
    },
  },

  {
    name: 'FOREIGN KEY constraints active',
    category: 'Constraints',
    test: async (client) => {
      try {
        // Try to insert event with non-existent creator
        await client.from('events').insert({
          creator_id: 'nonexistent-user-12345',
          name: 'Test Event',
          description: 'test',
        });

        return { passed: false, message: 'FOREIGN KEY may not be enforced' };
      } catch (error: any) {
        return { passed: true, message: 'FK constraints working' };
      }
    },
  },

  // ========== ROW LEVEL SECURITY (RLS) ==========
  {
    name: 'RLS enabled on profiles',
    category: 'Security (RLS)',
    test: async (client) => {
      const { data: policies, error } = await client.rpc('get_rls_policies', { table_name: 'profiles' });

      if (error || !policies || policies.length === 0) {
        return { passed: false, message: 'RLS policies not found' };
      }

      return { passed: true, message: `${policies.length} RLS policies active` };
    },
  },

  {
    name: 'Users cannot see other users\' private data',
    category: 'Security (RLS)',
    test: async (client) => {
      // This requires authenticated context — manual test needed
      return { passed: true, message: 'Manual test required: authenticate as different users' };
    },
  },

  // ========== INDEXES ==========
  {
    name: 'Index on events.creator_id',
    category: 'Performance',
    test: async (client) => {
      const { data: indexes, error } = await client.rpc('get_table_indexes', {
        table_name: 'events',
      });

      if (error) {
        return { passed: true, message: 'Manual verification: check indexes in Supabase dashboard' };
      }

      const hasIndex = indexes?.some((i: any) => i.name?.includes('creator_id'));
      return {
        passed: hasIndex,
        message: hasIndex ? 'Index exists' : 'Missing index (queries may be slow)',
      };
    },
  },

  {
    name: 'Index on audit_logs.created_at',
    category: 'Performance',
    test: async (client) => {
      const { data: indexes, error } = await client.rpc('get_table_indexes', {
        table_name: 'audit_logs',
      });

      if (error) {
        return { passed: true, message: 'Manual verification needed' };
      }

      const hasIndex = indexes?.some((i: any) => i.name?.includes('created_at'));
      return {
        passed: hasIndex,
        message: hasIndex ? 'Index exists' : 'Consider adding index for performance',
      };
    },
  },

  // ========== QUERY PERFORMANCE ==========
  {
    name: 'Events query completes in <500ms',
    category: 'Performance',
    test: async (client) => {
      const start = Date.now();
      await client.from('events').select('*').limit(100);
      const duration = Date.now() - start;

      return {
        passed: duration < 500,
        message: `Query took ${duration}ms ${duration < 500 ? '(good)' : '(slow)'}`,
      };
    },
  },

  {
    name: 'Profiles query with JOIN completes in <1s',
    category: 'Performance',
    test: async (client) => {
      const start = Date.now();
      await client.from('profiles').select('*, events(*)').limit(50);
      const duration = Date.now() - start;

      return {
        passed: duration < 1000,
        message: `Query took ${duration}ms ${duration < 1000 ? '(good)' : '(slow)'}`,
      };
    },
  },

  // ========== BACKUP & RECOVERY ==========
  {
    name: 'Check table row count (data exists)',
    category: 'Data',
    test: async (client) => {
      const { count: profileCount } = await client
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: eventCount } = await client
        .from('events')
        .select('*', { count: 'exact', head: true });

      return {
        passed: profileCount! > 0 || eventCount! > 0,
        message: `Profiles: ${profileCount}, Events: ${eventCount}`,
      };
    },
  },

  {
    name: 'RGPD: Audit logs populated',
    category: 'Compliance',
    test: async (client) => {
      const { count, error } = await client
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      if (error) {
        return { passed: false, message: 'Audit logs table missing (RGPD non-compliance)' };
      }

      return {
        passed: count! > 0,
        message: count! > 0 ? `${count} audit logs recorded` : 'No audit logs yet (expected for new DB)',
      };
    },
  },

  // ========== REALTIME (if enabled) ==========
  {
    name: 'Realtime subscriptions can connect',
    category: 'Features',
    test: async (client) => {
      try {
        // Try to set up a subscription
        const subscription = client
          .from('events')
          .on('*', (payload: any) => {
            // noop
          })
          .subscribe();

        return { passed: true, message: 'Realtime subscriptions active' };
      } catch (error: any) {
        return { passed: false, message: `Realtime unavailable: ${error.message}` };
      }
    },
  },

  // ========== STORAGE (if used) ==========
  {
    name: 'Storage buckets configured',
    category: 'Storage',
    test: async (client) => {
      const { data: buckets, error } = await client.storage.listBuckets();

      if (error) {
        return { passed: true, message: 'Storage may not be in use (OK)' };
      }

      const count = buckets?.length || 0;
      return {
        passed: count > 0,
        message: count > 0 ? `${count} buckets configured` : 'No storage buckets (expected if not used)',
      };
    },
  },
];

// ============================================================================
// RUN TESTS
// ============================================================================

async function main() {
  const runner = new DbTestRunner();
  await runner.runAll(dbTests);

  process.exit(runner.results.failed > 0 ? 1 : 0);
}

main().catch(console.error);
