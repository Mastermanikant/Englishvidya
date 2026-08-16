import { validateRedirectUrl } from './_shared/auth-utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const urlParams = new URL(request.url).searchParams;
  let redirectTo = urlParams.get('redirect') || '/profile/';
  
  redirectTo = validateRedirectUrl(redirectTo);
  
  const reqUrl = new URL(request.url);
  const rawSiteUrl = env.SITE_URL ? String(env.SITE_URL).replace(/[\r\n\s]+/g, '').replace(/\/+$/, '') : `${reqUrl.protocol}//${reqUrl.host}`;
  const siteUrl = rawSiteUrl || 'https://englishvidya.com';
  const redirectUri = `${siteUrl}/api/auth-callback`;
  const scope = 'openid email profile';
  
  const clientId = String(env.GOOGLE_CLIENT_ID || '').trim();

  // If Client ID is missing, provide a friendly explanation instead of Google 400 crash
  if (!clientId) {
    const html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>Google Sign-In Configuration Required</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: #1e293b; border: 1px solid #334155; padding: 2rem; border-radius: 1.5rem; max-width: 480px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    h1 { font-size: 1.4rem; color: #38bdf8; margin-bottom: 0.75rem; }
    p { font-size: 0.95rem; color: #94a3b8; line-height: 1.6; margin-bottom: 1.5rem; }
    .btn { display: inline-block; background: #2563eb; color: #fff; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 2.5rem; margin-bottom: 1rem;">⚙️</div>
    <h1>Google Login Setup</h1>
    <p>Google OAuth Client ID is not yet added in your Cloudflare Pages Dashboard Settings &rarr; Environment Variables (<strong>GOOGLE_CLIENT_ID</strong>).</p>
    <a href="/profile/" class="btn">&larr; Return to Dashboard</a>
  </div>
</body>
</html>`;
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // Generate CSRF token
  const csrfToken = crypto.randomUUID();
  const stateObj = {
    redirect: redirectTo,
    csrf: csrfToken
  };
  const state = btoa(JSON.stringify(stateObj));

  const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}` +
    `&prompt=select_account`;

  const headers = new Headers();
  headers.append('Location', url);
  headers.append('Set-Cookie', `ev_oauth_csrf=${csrfToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=300; Path=/`);

  return new Response(null, { status: 302, headers });
}
