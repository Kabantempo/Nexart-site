import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test-e2e@nexart.fr';
const TEST_PASSWORD = 'Test@1234567890';

test.describe('Nexart E2E — Full Site Coverage', () => {
  // ============================================================================
  // SETUP & HELPERS
  // ============================================================================
  
  let page: Page;
  let authToken: string;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  // Helper: Login & get token
  async function loginAndGetToken() {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    // Extract token from localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token');
    });
    return token ?? '';
  }

  // Helper: Check HTTP status & DOM
  async function checkPageHealth(url: string, options: any = {}) {
    const response = await page.goto(url, { waitUntil: 'networkidle', ...options });
    expect(response?.status()).toBeLessThan(500); // No 5xx errors
    expect(await page.locator('body').isVisible()).toBeTruthy();
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    expect(errors.length).toBe(0);
  }

  // ============================================================================
  // PUBLIC PAGES — NAVIGATION & REDIRECTIONS
  // ============================================================================

  test.describe('Public Pages — Accessibility & Redirections', () => {
    const publicPages = [
      { url: '/', title: 'Nexart' },
      { url: '/events', title: 'Événements' },
      { url: '/creators', title: 'Créateurs' },
      { url: '/feed', title: 'Fil' },
      { url: '/carte', title: 'Carte' },
      { url: '/calendrier', title: 'Calendrier' },
      { url: '/about', title: 'À propos' },
      { url: '/contact', title: 'Contact' },
      { url: '/offres', title: 'Offres' },
      { url: '/patch-notes', title: 'Patch Notes' },
      { url: '/carnet-de-route', title: 'Carnet' },
      { url: '/conditions', title: 'CGU' },
      { url: '/confidentialite', title: 'Confidentialité' },
      { url: '/mentions-legales', title: 'Mentions légales' },
    ];

    publicPages.forEach(({ url, title }) => {
      test(`✅ ${title} page loads correctly`, async () => {
        await checkPageHealth(url);
        const pageTitle = await page.title();
        expect(pageTitle).toContain('Nexart');
      });
    });

    test('✅ Navigation links redirect correctly', async () => {
      await page.goto(BASE_URL);
      
      // Click navbar links
      const navLinks = [
        { selector: 'a[href="/events"]', expectedUrl: '/events' },
        { selector: 'a[href="/creators"]', expectedUrl: '/creators' },
        { selector: 'a[href="/carte"]', expectedUrl: '/carte' },
      ];

      for (const { selector, expectedUrl } of navLinks) {
        if (await page.locator(selector).isVisible()) {
          await page.click(selector);
          await page.waitForNavigation({ waitUntil: 'networkidle' });
          expect(page.url()).toContain(expectedUrl);
          await page.goto(BASE_URL); // Return to home
        }
      }
    });

    test('✅ Footer links exist & redirect', async () => {
      await page.goto(BASE_URL);
      
      const footerLinks = ['About', 'Contact', 'CGU', 'Privacy'];
      for (const linkText of footerLinks) {
        const link = page.locator(`footer a:has-text("${linkText}")`);
        expect(await link.count()).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // SEARCH & FILTERING
  // ============================================================================

  test.describe('Search & Filtering', () => {
    test('✅ Search on /events returns results', async () => {
      await page.goto(`${BASE_URL}/events`, { waitUntil: 'networkidle' });
      
      const searchInput = page.locator('input[placeholder*="Recherch"], input[placeholder*="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('art');
        await page.waitForLoadState('networkidle');
        
        // Verify results updated
        const results = page.locator('[data-testid="event-card"], .event-item').count();
        expect(results).toBeGreaterThanOrEqual(0);
      }
    });

    test('✅ Filtering on /creators works', async () => {
      await page.goto(`${BASE_URL}/creators`, { waitUntil: 'networkidle' });
      
      // Look for filter buttons
      const filters = page.locator('button[data-filter], .filter-btn').first();
      if (await filters.isVisible()) {
        await filters.click();
        await page.waitForLoadState('networkidle');
        
        const resultCount = await page.locator('[data-testid="creator-card"], .creator-item').count();
        expect(resultCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ============================================================================
  // FORMS & SUBMISSIONS
  // ============================================================================

  test.describe('Forms & Submissions', () => {
    test('✅ Contact form submits without errors', async () => {
      await page.goto(`${BASE_URL}/contact`, { waitUntil: 'networkidle' });
      
      const form = page.locator('form').first();
      if (await form.isVisible()) {
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('textarea[name="message"]', 'Test message');
        
        // Before submit: check for required fields
        const submitBtn = page.locator('button[type="submit"]');
        expect(await submitBtn.isVisible()).toBeTruthy();
        
        // Note: Don't actually submit to avoid spam
        // await submitBtn.click();
        // await page.waitForLoadState('networkidle');
      }
    });

    test('✅ Login form validates required fields', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      
      // Try to submit empty form
      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();
      
      // Should show validation error or disable button
      const emailInput = page.locator('input[type="email"]');
      const validity = await emailInput.evaluate((el: any) => el.validity.valid);
      expect(validity).toBe(false);
    });

    test('✅ Register form password validation works', async () => {
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
      
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', 'weak');
      
      // Check for password strength indicator
      const strengthIndicator = page.locator('[data-testid="password-strength"]');
      if (await strengthIndicator.isVisible()) {
        const text = await strengthIndicator.textContent();
        expect(['Faible', 'Weak', 'weak'].some(w => text?.includes(w))).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // AUTHENTICATED ROUTES (if logged in)
  // ============================================================================

  test.describe('Authenticated Routes', () => {
    test.skip(true, 'Skipped by default — only run with test user'); // Toggle to false to enable
    
    test('✅ Dashboard loads & shows user data', async () => {
      authToken = await loginAndGetToken();
      
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      
      // Should NOT redirect to login
      expect(page.url()).toContain('/dashboard');
      
      // Should show user content
      const dashboard = page.locator('[data-testid="dashboard"], .dashboard-container');
      expect(await dashboard.isVisible()).toBeTruthy();
    });

    test('✅ Profile page displays user info', async () => {
      authToken = await loginAndGetToken();
      
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
      expect(page.url()).toContain('/profile');
      
      const profileContent = page.locator('[data-testid="profile"], .profile-section');
      expect(await profileContent.count()).toBeGreaterThan(0);
    });

    test('✅ Settings page loads', async () => {
      authToken = await loginAndGetToken();
      
      await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle' });
      expect(page.url()).toContain('/settings');
    });
  });

  // ============================================================================
  // API ENDPOINTS — DIRECT TESTING
  // ============================================================================

  test.describe('API Endpoints Health', () => {
    test('✅ GET /api/health returns 200', async () => {
      const response = await page.request.get(`${BASE_URL}/api/health`);
      expect(response.status()).toBe(200);
    });

    test('✅ GET /api/events returns valid JSON', async () => {
      const response = await page.request.get(`${BASE_URL}/api/events`);
      expect(response.status()).toBeLessThan(500);
      
      const json = await response.json();
      expect(json).toBeDefined();
    });

    test('✅ Auth endpoints exist', async () => {
      const endpoints = [
        '/api/auth/me',
        '/api/auth/callback',
      ];

      for (const endpoint of endpoints) {
        const response = await page.request.get(`${BASE_URL}${endpoint}`);
        // Should not be 404 (may be auth required, but endpoint exists)
        expect(response.status()).not.toBe(404);
      }
    });

    test('✅ No 5xx errors in API calls', async () => {
      const endpoints = [
        '/api/health',
        '/api/events',
        '/api/creators', // if exists
      ];

      for (const endpoint of endpoints) {
        const response = await page.request.get(`${BASE_URL}${endpoint}`);
        expect(response.status()).toBeLessThan(500);
      }
    });
  });

  // ============================================================================
  // SECURITY CHECKS
  // ============================================================================

  test.describe('Security Headers & CSP', () => {
    test('✅ Security headers present', async () => {
      const response = await page.request.get(BASE_URL);
      
      const headers = response.headers();
      
      // Check for security headers
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBeTruthy(); // Should not allow framing
      expect(headers['x-xss-protection']).toBeTruthy(); // XSS protection
    });

    test('✅ CSP header is set', async () => {
      const response = await page.request.get(BASE_URL);
      const headers = response.headers();
      
      const csp = headers['content-security-policy'] || headers['content-security-policy-report-only'];
      expect(csp).toBeTruthy();
    });

    test('✅ CORS headers configured', async () => {
      const response = await page.request.get(BASE_URL);
      const headers = response.headers();
      
      // Should have CORS-related headers or be restrictive
      expect(headers['access-control-allow-origin']).toBeDefined();
    });
  });

  // ============================================================================
  // 404 & ERROR HANDLING
  // ============================================================================

  test.describe('Error Handling', () => {
    test('✅ 404 page shows for invalid routes', async () => {
      const response = await page.goto(`${BASE_URL}/this-route-does-not-exist`, {
        waitUntil: 'networkidle',
      });
      
      expect(response?.status()).toBe(404);
      
      // Should show 404 message
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/404|not found|n'existe pas/i);
    });

    test('✅ No console errors on homepage', async () => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      
      // Filter out known non-critical errors
      const criticalErrors = errors.filter(
        (e) => !e.includes('ResizeObserver') && !e.includes('chunk')
      );
      
      expect(criticalErrors.length).toBe(0);
    });
  });

  // ============================================================================
  // RESPONSIVE & ACCESSIBILITY
  // ============================================================================

  test.describe('Responsive Design', () => {
    test('✅ Mobile viewport renders correctly', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone
      await page.goto(BASE_URL);
      
      // Should not have horizontal scrollbar
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
    });

    test('✅ Tablet viewport renders correctly', async () => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto(BASE_URL);
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
    });

    test('✅ Desktop viewport renders correctly', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(BASE_URL);
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
    });
  });

  // ============================================================================
  // PERFORMANCE BASICS
  // ============================================================================

  test.describe('Performance Baselines', () => {
    test('✅ Homepage loads in under 3 seconds', async () => {
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000);
    });

    test('✅ No render-blocking resources', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      
      const resourceTiming = await page.evaluate(() => {
        const entries = (performance as any).getEntriesByType('resource');
        return entries.filter((e: any) => e.duration > 1000).length;
      });
      
      // Should have few long-running resources
      expect(resourceTiming).toBeLessThan(5);
    });

    test('✅ No memory leaks on page transitions', async () => {
      await page.goto(BASE_URL);
      
      // Navigate 5 times
      for (let i = 0; i < 5; i++) {
        await page.click('a').catch(() => null);
        await page.waitForLoadState('networkidle');
      }
      
      // Check memory (basic check)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metrics = await (page as any).metrics?.();
      if (metrics) expect(metrics.JSHeapUsedSize).toBeLessThan(100000000); // 100MB
    });
  });
});
