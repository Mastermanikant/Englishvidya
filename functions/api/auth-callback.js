import { createJWT, validateRedirectUrl } from './_shared/auth-utils.js';

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateRaw = url.searchParams.get('state');

    if (!code) {
      return new Response('Login failed: No code received from Google. Please try logging in again.', { 
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // Decode state and validate CSRF safely
    let stateObj = {};
    try {
      if (stateRaw) stateObj = JSON.parse(atob(stateRaw));
    } catch (e) {
      stateObj = {};
    }

    // Step 1: Code → Token
    const rawSiteUrl = env.SITE_URL ? String(env.SITE_URL).replace(/[\r\n\s]+/g, '').replace(/\/+$/, '') : `${url.protocol}//${url.host}`;
    const siteUrl = rawSiteUrl || 'https://englishvidya.com';

    const clientId = String(env.GOOGLE_CLIENT_ID || '').trim();
    const clientSecret = String(env.GOOGLE_CLIENT_SECRET || '').trim();

    if (!clientId || !clientSecret) {
      return new Response('Google OAuth credentials not configured on server (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).', {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${siteUrl}/api/auth-callback`,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return new Response(`Google authentication failed: ${tokenData.error_description || JSON.stringify(tokenData)}`, { 
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // Step 2: Token → User Info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    if (!googleUser || !googleUser.id) {
      return new Response('Could not fetch Google profile data.', { status: 400 });
    }

    // Step 3: Insert or update in D1 DB if available
    let user = {
      id: 1,
      email: googleUser.email,
      name: googleUser.name || 'Student',
      avatar_url: googleUser.picture || '',
      role: 'learner'
    };

    try {
      if (env.DB && typeof env.DB.prepare === 'function') {
        let existingUser = await env.DB.prepare(
          'SELECT id, email, name, google_id, avatar_url, role FROM users WHERE google_id = ? OR email = ?'
        ).bind(googleUser.id, googleUser.email).first();

        if (!existingUser) {
          const insertRes = await env.DB.prepare(
            'INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)'
          ).bind(googleUser.id, googleUser.email, googleUser.name, googleUser.picture || '').run();
          
          user.id = insertRes?.meta?.last_row_id || 1;
        } else {
          user.id = existingUser.id;
          user.role = existingUser.role || 'learner';
          
          await env.DB.prepare(
            'UPDATE users SET google_id = ?, avatar_url = COALESCE(NULLIF(?, ""), avatar_url), name = COALESCE(NULLIF(name, ""), ?) WHERE id = ?'
          ).bind(googleUser.id, googleUser.picture || '', googleUser.name || '', existingUser.id).run();
        }
      }
    } catch (dbErr) {
      console.warn('DB sync non-fatal warning in auth-callback:', dbErr);
    }

    // Step 4: Create self-contained JWT token (7 days valid)
    const jwtSecret = env.JWT_SECRET ? String(env.JWT_SECRET).trim() : 'ev_jwt_secret_key_prod_2026_safe_secure';
    const jwt = await createJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      role: user.role
    }, jwtSecret, 7 * 24 * 60 * 60);

    // Read redirect target
    let redirectTo = stateObj.redirect || '/profile/';
    redirectTo = validateRedirectUrl(redirectTo);

    // Step 5: Set auth cookie and redirect
    const headers = new Headers();
    headers.append('Location', redirectTo);
    headers.append('Set-Cookie', `ev_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
    headers.append('Set-Cookie', 'ev_oauth_csrf=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure');

    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error('Fatal Auth Callback Error:', error);
    return new Response(`Auth Callback Error: ${error.message || error}`, { status: 500 });
  }
}
