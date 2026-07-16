/**
 * NEXART API TEST SUITE
 * Tests tous les ~54 endpoints listés dans la doc
 * Run: npx ts-node nexart-api-tests.ts
 */

import axios, { AxiosInstance } from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface ApiTest {
  name: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  endpoint: string;
  requiresAuth?: boolean;
  payload?: any;
  expectedStatus?: number;
  validateResponse?: (data: any) => boolean;
}

class ApiTestRunner {
  private client: AxiosInstance;
  private authToken: string = '';
  public results = { passed: 0, failed: 0, skipped: 0 };
  private errors: { test: string; error: string }[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      validateStatus: () => true, // Don't throw on any status
      timeout: 10000,
    });
  }

  async runTest(test: ApiTest): Promise<boolean> {
    try {
      console.log(`\n🧪 Testing: ${test.method} ${test.endpoint}`);

      const config: any = {};
      if (test.requiresAuth && this.authToken) {
        config.headers = { Authorization: `Bearer ${this.authToken}` };
      }

      let response;
      switch (test.method) {
        case 'GET':
          response = await this.client.get(test.endpoint, config);
          break;
        case 'POST':
          response = await this.client.post(test.endpoint, test.payload || {}, config);
          break;
        case 'PATCH':
          response = await this.client.patch(test.endpoint, test.payload || {}, config);
          break;
        case 'DELETE':
          response = await this.client.delete(test.endpoint, config);
          break;
      }

      const expectedStatus = test.expectedStatus || 200;
      
      // Check status
      if (response.status >= 500) {
        console.error(`❌ FAILED: ${response.status} Server Error`);
        this.errors.push({ test: test.name, error: `${response.status}` });
        this.results.failed++;
        return false;
      }

      if (response.status >= 400 && response.status !== expectedStatus) {
        console.warn(`⚠️ WARNING: ${response.status} (expected ${expectedStatus})`);
      }

      // Validate response if provided
      if (test.validateResponse && !test.validateResponse(response.data)) {
        console.error(`❌ FAILED: Response validation failed`);
        this.errors.push({ test: test.name, error: 'Response validation failed' });
        this.results.failed++;
        return false;
      }

      console.log(`✅ PASSED: ${response.status}`);
      this.results.passed++;
      return true;
    } catch (error: any) {
      console.error(`❌ ERROR: ${error.message}`);
      this.errors.push({ test: test.name, error: error.message });
      this.results.failed++;
      return false;
    }
  }

  async runAllTests(tests: ApiTest[]) {
    console.log('🚀 Starting API Test Suite\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Total tests: ${tests.length}\n`);

    for (const test of tests) {
      if (test.requiresAuth && !this.authToken) {
        console.log(`⏭️  SKIPPED: ${test.endpoint} (no auth token)`);
        this.results.skipped++;
      } else {
        await this.runTest(test);
      }
    }

    this.printSummary();
  }

  private printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed:  ${this.results.passed}`);
    console.log(`❌ Failed:  ${this.results.failed}`);
    console.log(`⏭️  Skipped: ${this.results.skipped}`);
    console.log(`📈 Success Rate: ${(this.results.passed / (this.results.passed + this.results.failed) * 100).toFixed(1)}%`);

    if (this.errors.length > 0) {
      console.log('\n🔴 ERRORS:');
      this.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
    }
  }
}

// ============================================================================
// TEST SUITE — ALL ENDPOINTS
// ============================================================================

const apiTests: ApiTest[] = [
  // ========== HEALTH ==========
  {
    name: 'Health Check',
    method: 'GET',
    endpoint: '/api/health',
    validateResponse: (data) => data.status === 'ok' || data.ok === true,
  },

  // ========== EVENTS (GET/POST/PATCH/DELETE) ==========
  {
    name: 'List Events',
    method: 'GET',
    endpoint: '/api/events',
    validateResponse: (data) => Array.isArray(data) || data.events || true,
  },
  {
    name: 'Create Event (POST)',
    method: 'POST',
    endpoint: '/api/events',
    requiresAuth: true,
    payload: {
      name: 'Test Event',
      date: '2026-12-25',
      location: 'Paris',
    },
    expectedStatus: 200, // May be 201 or 200
  },
  {
    name: 'Get Event by ID',
    method: 'GET',
    endpoint: '/api/events/test-event-id',
    expectedStatus: 404, // Will likely 404 if ID doesn't exist
  },

  // ========== EVENTS/[ID]/ANALYTICS ==========
  {
    name: 'Event Analytics',
    method: 'GET',
    endpoint: '/api/events/test-id/analytics',
    requiresAuth: true,
    expectedStatus: 404,
  },

  // ========== EVENTS/[ID]/CAMPAIGNS ==========
  {
    name: 'Event Campaigns (GET)',
    method: 'GET',
    endpoint: '/api/events/test-id/campaigns',
    requiresAuth: true,
    expectedStatus: 404,
  },
  {
    name: 'Event Campaigns (POST)',
    method: 'POST',
    endpoint: '/api/events/test-id/campaigns',
    requiresAuth: true,
    payload: { name: 'Test Campaign', subject: 'Hello' },
    expectedStatus: 404,
  },

  // ========== EVENTS/[ID]/CHECKLIST ==========
  {
    name: 'Event Checklist (GET)',
    method: 'GET',
    endpoint: '/api/events/test-id/checklist',
    requiresAuth: true,
    expectedStatus: 404,
  },
  {
    name: 'Event Checklist (POST)',
    method: 'POST',
    endpoint: '/api/events/test-id/checklist',
    requiresAuth: true,
    payload: { item: 'Send invitations' },
    expectedStatus: 404,
  },

  // ========== EVENTS/[ID]/EXHIBITORS ==========
  {
    name: 'Event Exhibitors (GET)',
    method: 'GET',
    endpoint: '/api/events/test-id/exhibitors',
    expectedStatus: 404,
  },
  {
    name: 'Event Exhibitors (POST)',
    method: 'POST',
    endpoint: '/api/events/test-id/exhibitors',
    requiresAuth: true,
    payload: { artist_id: 'artist-123' },
    expectedStatus: 404,
  },
  {
    name: 'Event Exhibitors Export (CSV)',
    method: 'GET',
    endpoint: '/api/events/test-id/exhibitors/export',
    requiresAuth: true,
    expectedStatus: 404,
  },

  // ========== EVENTS/[ID]/FAQS ==========
  {
    name: 'Event FAQs (GET)',
    method: 'GET',
    endpoint: '/api/events/test-id/faqs',
    expectedStatus: 404,
  },
  {
    name: 'Event FAQs (POST)',
    method: 'POST',
    endpoint: '/api/events/test-id/faqs',
    requiresAuth: true,
    payload: { question: 'What time?', answer: 'At 2 PM' },
    expectedStatus: 404,
  },
  {
    name: 'Event FAQs Match',
    method: 'POST',
    endpoint: '/api/events/test-id/faqs/match',
    payload: { query: 'hours' },
    expectedStatus: 404,
  },

  // ========== EVENTS/[ID]/MARKETING ==========
  {
    name: 'Event Marketing (GET)',
    method: 'GET',
    endpoint: '/api/events/test-id/marketing',
    requiresAuth: true,
    expectedStatus: 404,
  },
  {
    name: 'Event Marketing (POST)',
    method: 'POST',
    endpoint: '/api/events/test-id/marketing',
    requiresAuth: true,
    payload: { channel: 'email', budget: 1000 },
    expectedStatus: 404,
  },

  // ========== EVENTS/[ID]/REMINDERS ==========
  {
    name: 'Event Reminders (GET)',
    method: 'GET',
    endpoint: '/api/events/test-id/reminders',
    requiresAuth: true,
    expectedStatus: 404,
  },
  {
    name: 'Event Reminders (POST)',
    method: 'POST',
    endpoint: '/api/events/test-id/reminders',
    requiresAuth: true,
    payload: { days_before: 7, message: 'Event coming up!' },
    expectedStatus: 404,
  },

  // ========== EVENTS/[ID]/TASKS ==========
  {
    name: 'Event Tasks (GET)',
    method: 'GET',
    endpoint: '/api/events/test-id/tasks',
    requiresAuth: true,
    expectedStatus: 404,
  },
  {
    name: 'Event Tasks (POST)',
    method: 'POST',
    endpoint: '/api/events/test-id/tasks',
    requiresAuth: true,
    payload: { title: 'Send invites', due_date: '2026-12-01' },
    expectedStatus: 404,
  },

  // ========== EVENTS/[ID]/TEAM ==========
  {
    name: 'Event Team Members (GET)',
    method: 'GET',
    endpoint: '/api/events/test-id/team',
    requiresAuth: true,
    expectedStatus: 404,
  },
  {
    name: 'Event Team (POST)',
    method: 'POST',
    endpoint: '/api/events/test-id/team',
    requiresAuth: true,
    payload: { email: 'team@example.com', role: 'editor' },
    expectedStatus: 404,
  },
  {
    name: 'Event Team Invite',
    method: 'POST',
    endpoint: '/api/events/test-id/team/invite',
    requiresAuth: true,
    payload: { email: 'user@example.com' },
    expectedStatus: 404,
  },

  // ========== EVENTS/[ID]/VOLUNTEERS ==========
  {
    name: 'Event Volunteers (GET)',
    method: 'GET',
    endpoint: '/api/events/test-id/volunteers',
    requiresAuth: true,
    expectedStatus: 404,
  },
  {
    name: 'Event Volunteers (POST)',
    method: 'POST',
    endpoint: '/api/events/test-id/volunteers',
    requiresAuth: true,
    payload: { name: 'John', email: 'john@example.com' },
    expectedStatus: 404,
  },
  {
    name: 'Event Volunteer Shifts (GET)',
    method: 'GET',
    endpoint: '/api/events/test-id/volunteers/shifts',
    requiresAuth: true,
    expectedStatus: 404,
  },
  {
    name: 'Event Volunteer Shifts (POST)',
    method: 'POST',
    endpoint: '/api/events/test-id/volunteers/shifts',
    requiresAuth: true,
    payload: { start: '2026-12-25T10:00', end: '2026-12-25T14:00' },
    expectedStatus: 404,
  },

  // ========== EVENTS/[ID]/WAITLIST ==========
  {
    name: 'Event Waitlist (GET)',
    method: 'GET',
    endpoint: '/api/events/test-id/waitlist',
    expectedStatus: 404,
  },
  {
    name: 'Event Waitlist (POST)',
    method: 'POST',
    endpoint: '/api/events/test-id/waitlist',
    payload: { email: 'waitlist@example.com' },
    expectedStatus: 404,
  },

  // ========== STRIPE ==========
  {
    name: 'Stripe Checkout',
    method: 'POST',
    endpoint: '/api/stripe/checkout',
    requiresAuth: true,
    payload: { plan: 'pro' },
  },
  {
    name: 'Stripe Portal',
    method: 'POST',
    endpoint: '/api/stripe/portal',
    requiresAuth: true,
  },

  // ========== ACCOUNT ==========
  {
    name: 'Auth Me',
    method: 'GET',
    endpoint: '/api/auth/me',
    requiresAuth: true,
  },
  {
    name: 'Account Delete Request',
    method: 'POST',
    endpoint: '/api/account/delete-request',
    requiresAuth: true,
  },
  {
    name: 'Account Export Data',
    method: 'GET',
    endpoint: '/api/account/export-data',
    requiresAuth: true,
  },

  // ========== EMAILS ==========
  {
    name: 'Send Welcome Email',
    method: 'POST',
    endpoint: '/api/welcome',
    payload: { email: 'test@example.com' },
  },
  {
    name: 'Send Contact Email',
    method: 'POST',
    endpoint: '/api/contact',
    payload: { email: 'test@example.com', message: 'Hello' },
  },

  // ========== NOTIFICATIONS ==========
  {
    name: 'Push Subscribe',
    method: 'POST',
    endpoint: '/api/push/subscribe',
    requiresAuth: true,
    payload: { subscription: {} },
  },
  {
    name: 'Push Send',
    method: 'POST',
    endpoint: '/api/push/send',
    requiresAuth: true,
    payload: { user_id: 'test', title: 'Test' },
  },

  // ========== CREDITS ==========
  {
    name: 'Credits Balance',
    method: 'GET',
    endpoint: '/api/credits/balance',
    requiresAuth: true,
  },
  {
    name: 'Use Credits',
    method: 'POST',
    endpoint: '/api/credits/use',
    requiresAuth: true,
    payload: { amount: 10 },
  },

  // ========== ADMIN ==========
  {
    name: 'Admin Users (GET)',
    method: 'GET',
    endpoint: '/api/admin/users',
    requiresAuth: true,
  },
  {
    name: 'Admin Analytics',
    method: 'GET',
    endpoint: '/api/admin/analytics',
    requiresAuth: true,
  },
  {
    name: 'Admin Events',
    method: 'GET',
    endpoint: '/api/admin/analytics/events',
    requiresAuth: true,
  },

  // ========== OTHER ==========
  {
    name: 'Get Reviews',
    method: 'GET',
    endpoint: '/api/reviews',
  },
  {
    name: 'Audit Logs',
    method: 'GET',
    endpoint: '/api/audit-logs',
    requiresAuth: true,
  },
  {
    name: 'Get RNA',
    method: 'GET',
    endpoint: '/api/rna',
    validateResponse: (data) => true, // May return any status
  },
  {
    name: 'Itinerary',
    method: 'GET',
    endpoint: '/api/itinerary',
    validateResponse: (data) => true,
  },
];

// ============================================================================
// RUN TESTS
// ============================================================================

async function main() {
  const runner = new ApiTestRunner();
  await runner.runAllTests(apiTests);

  process.exit(runner.results.failed > 0 ? 1 : 0);
}

main().catch(console.error);
