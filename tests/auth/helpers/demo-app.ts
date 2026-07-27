/**
 * Demo auth app — fake login/me/logout API qua page.route().
 *
 * Vì sao có file này:
 *   Project Uniqlo không có 3 role (customer/admin/operator) trên server thật.
 *   Để minh hoạ flow storageState cho multi-role mà vẫn deterministic + offline,
 *   ta serve 1 app tối giản qua intercept. CƠ CHẾ giống hệt app thật:
 *     - Login POST /api/login → server Set-Cookie session=<token>
 *     - Browser gửi cookie ở request sau
 *     - storageState() lưu cookie → load lại = đã login.
 *
 * Trên project thật:
 *   - KHÔNG cần installDemoAppRoutes (BE thật đã làm việc đó).
 *   - Chỉ giữ lại pattern setup file + storageState + role fixture.
 */

import type { BrowserContext, Request } from '@playwright/test';

export const DEMO_ORIGIN = 'https://demo.shop';

export const USERS = {
  customer: {
    username: 'customer1',
    password: 'pass',
    token: 'cust-tok-001',
    role: 'customer',
    name: 'Alice Customer',
  },
  admin: {
    username: 'admin1',
    password: 'pass',
    token: 'admin-tok-002',
    role: 'admin',
    name: 'Bob Admin',
  },
  operator: {
    username: 'operator1',
    password: 'pass',
    token: 'op-tok-003',
    role: 'operator',
    name: 'Carol Operator',
  },
} as const;

export const ROLES = ['customer', 'admin', 'operator'] as const;
export type Role = (typeof ROLES)[number];

/** State files cho từng role — gom 1 chỗ để tests không hard-code path lung tung. */
export const AUTH_STATE = {
  customer: 'tests/auth/.auth/customer.json',
  admin: 'tests/auth/.auth/admin.json',
  operator: 'tests/auth/.auth/operator.json',
} as const;

const TOKEN_MAP: Record<string, (typeof USERS)[keyof typeof USERS]> = Object.fromEntries(
  Object.values(USERS).map((u) => [u.token, u]),
);

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers()['cookie'] || '';
  const match = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return match ? match[1] : undefined;
}

/**
 * Install fake routes for the demo app. Call trong setup file + beforeEach của test.
 */
export async function installDemoAppRoutes(context: BrowserContext): Promise<void> {
  // GET demo.shop/ → SPA HTML
  await context.route(DEMO_ORIGIN + '/', async (route) => {
    await route.fulfill({ contentType: 'text/html; charset=utf-8', body: DEMO_APP_HTML });
  });

  // POST /api/login → validate credentials, Set-Cookie session
  await context.route(DEMO_ORIGIN + '/api/login', async (route) => {
    let body: { username?: string; password?: string } = {};
    try {
      body = JSON.parse(route.request().postData() || '{}');
    } catch {
      /* malformed JSON */
    }
    const user = Object.values(USERS).find(
      (u) => u.username === body.username && u.password === body.password,
    );
    if (!user) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${user.token}; Path=/; SameSite=Lax; Max-Age=86400`,
      },
      body: JSON.stringify({ role: user.role, name: user.name }),
    });
  });

  // GET /api/me → trả thông tin user theo cookie session
  await context.route(DEMO_ORIGIN + '/api/me', async (route) => {
    const token = readCookie(route.request(), 'session');
    const user = token ? TOKEN_MAP[token] : null;
    if (!user) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not authenticated' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ username: user.username, name: user.name, role: user.role }),
    });
  });

  // POST /api/logout → expire cookie
  await context.route(DEMO_ORIGIN + '/api/logout', async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'session=; Path=/; Max-Age=0; SameSite=Lax',
      },
      body: '{}',
    });
  });
}

const DEMO_APP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Demo Auth Shop</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 32px auto; padding: 20px; color: #1f2937; }
  h1 { margin-top: 0; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  .badge-customer { background: #d1fae5; color: #065f46; }
  .badge-admin    { background: #fee2e2; color: #991b1b; }
  .badge-operator { background: #fef3c7; color: #92400e; }
  .features { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
  .feature  { padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb; cursor: pointer; }
  input  { padding: 8px; margin: 4px 0 12px; display: block; width: 220px; font-size: 14px; }
  button { padding: 8px 16px; cursor: pointer; font-size: 14px; }
  dl { display: grid; grid-template-columns: 110px 1fr; gap: 8px 16px; }
  dt { font-weight: 600; color: #6b7280; }
  dd { margin: 0; }
  .error { color: #b91c1c; font-size: 14px; }
  .hint  { margin-top: 24px; padding: 12px; background: #f3f4f6; border-radius: 6px; font-size: 12px; color: #6b7280; }
</style>
</head>
<body>
<h1 data-testid="title">Demo Auth Shop</h1>

<section id="login-section" data-testid="login-section" hidden>
  <h2>Login</h2>
  <form id="login-form" data-testid="login-form">
    <label>Username
      <input id="username" data-testid="username-input" autocomplete="username">
    </label>
    <label>Password
      <input id="password" type="password" data-testid="password-input" autocomplete="current-password">
    </label>
    <button type="submit" data-testid="login-btn">Login</button>
  </form>
  <p class="error" data-testid="error-msg" hidden></p>
  <div class="hint">
    Demo users:<br>
    customer1 / pass · admin1 / pass · operator1 / pass
  </div>
</section>

<section id="info-section" data-testid="info-section" hidden>
  <h2>Account Information</h2>
  <dl>
    <dt>Name</dt><dd data-testid="info-name"></dd>
    <dt>Username</dt><dd data-testid="info-username"></dd>
    <dt>Role</dt>
    <dd>
      <span data-testid="info-role"></span>
      &nbsp;<span class="badge" data-testid="info-role-badge"></span>
    </dd>
  </dl>
  <h3>Available Features</h3>
  <div class="features" data-testid="features-list"></div>
  <button data-testid="logout-btn" style="margin-top:24px">Logout</button>
</section>

<script>
const ROLE_FEATURES = {
  customer: [
    { id: 'orders',   label: 'Order History' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'profile',  label: 'Profile' },
  ],
  admin: [
    { id: 'user-management', label: 'User Management' },
    { id: 'system-settings', label: 'System Settings' },
    { id: 'audit-logs',      label: 'Audit Logs' },
  ],
  operator: [
    { id: 'ops-dashboard', label: 'Ops Dashboard' },
    { id: 'reports',       label: 'Reports' },
    { id: 'inventory',     label: 'Inventory' },
  ],
};

const $ = (sel) => document.querySelector(sel);

function showLogin() {
  document.getElementById('login-section').hidden = false;
  document.getElementById('info-section').hidden = true;
}

function showInfo(data) {
  document.getElementById('login-section').hidden = true;
  document.getElementById('info-section').hidden = false;
  $('[data-testid="info-name"]').textContent = data.name;
  $('[data-testid="info-username"]').textContent = data.username;
  $('[data-testid="info-role"]').textContent = data.role;
  const badge = $('[data-testid="info-role-badge"]');
  badge.textContent = data.role;
  badge.className = 'badge badge-' + data.role;
  const features = ROLE_FEATURES[data.role] || [];
  $('[data-testid="features-list"]').innerHTML = features
    .map((f) => '<button class="feature" data-testid="feature-' + f.id + '">' + f.label + '</button>')
    .join('');
}

async function refresh() {
  try {
    const res = await fetch('/api/me');
    if (res.ok) showInfo(await res.json());
    else showLogin();
  } catch {
    showLogin();
  }
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const errEl = $('[data-testid="error-msg"]');
  if (res.ok) {
    errEl.hidden = true;
    await refresh();
  } else {
    const err = await res.json().catch(() => ({}));
    errEl.textContent = err.error || 'Login failed';
    errEl.hidden = false;
  }
});

$('[data-testid="logout-btn"]').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  await refresh();
});

refresh();
</script>
</body>
</html>`;
