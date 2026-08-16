import { validateRedirectUrl } from './_shared/auth-utils.js';

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const urlParams = new URL(request.url).searchParams;
    let redirectTo = urlParams.get('redirect') || '/profile/';
    
    redirectTo = validateRedirectUrl(redirectTo);
    
    const reqUrl = new URL(request.url);
    const rawSiteUrl = env.SITE_URL ? String(env.SITE_URL).replace(/[\r\n\s]+/g, '').replace(/\/+$/, '') : `${reqUrl.protocol}//${reqUrl.host}`;
    const siteUrl = rawSiteUrl || 'https://englishvidya.com';
    const redirectUri = `${siteUrl}/api/auth-callback`;
    const scope = 'openid email profile';
    
    const clientId = String(env.GOOGLE_CLIENT_ID || '321582100536-8upe62akrjoh3vfuc9v526je14h5c4m5.apps.googleusercontent.com').trim();

    // Generate CSRF token
    const csrfToken = crypto.randomUUID();
    const stateObj = {
      redirect: redirectTo,
      csrf: csrfToken
    };
    const state = btoa(JSON.stringify(stateObj));

    const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(state)}` +
      `&prompt=select_account`;

    const headers = new Headers();
    headers.append('Location', url);
    headers.append('Set-Cookie', `ev_oauth_csrf=${csrfToken}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=600`);
    
    return new Response(null, {
      status: 302,
      headers
    });
  } catch (err) {
    console.error('Fatal /api/auth-google error:', err);
    return Response.redirect('/login/?error=google_auth_init_failed', 302);
  }
}
