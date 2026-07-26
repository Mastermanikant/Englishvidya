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
  
  // Generate CSRF token
  const csrfToken = crypto.randomUUID();
  const stateObj = {
    redirect: redirectTo,
    csrf: csrfToken
  };
  const state = btoa(JSON.stringify(stateObj));

  const clientId = String(env.GOOGLE_CLIENT_ID || '').replace(/[\r\n\s]+/g, '');

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
