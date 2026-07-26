import { createJWT, validateRedirectUrl } from './_shared/auth-utils.js';

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateRaw = url.searchParams.get('state');

    if (!code) {
      return new Response('Login failed: No code received from Google', { status: 400 });
    }

    // Decode state and validate CSRF
    let stateObj = {};
    try {
      if (stateRaw) stateObj = JSON.parse(atob(stateRaw));
    } catch (e) {
      // ignore
    }
    
    const cookieHeader = request.headers.get('Cookie') || '';
    const csrfMatch = cookieHeader.match(/(?:^|;\s*)ev_oauth_csrf=([^;]*)/);
    const cookieCsrf = csrfMatch ? csrfMatch[1] : null;

    if (!cookieCsrf || !stateObj.csrf || cookieCsrf !== stateObj.csrf) {
      return new Response('Login failed: Security token mismatch (CSRF). Please try logging in again.', { status: 403 });
    }

    // Step 1: Code → Token
    const rawSiteUrl = env.SITE_URL ? String(env.SITE_URL).replace(/[\r\n\s]+/g, '').replace(/\/+$/, '') : `${url.protocol}//${url.host}`;
    const siteUrl = rawSiteUrl || 'https://englishvidya.com';

    const clientId = String(env.GOOGLE_CLIENT_ID || '').replace(/[\r\n\s]+/g, '');
    const clientSecret = String(env.GOOGLE_CLIENT_SECRET || '').replace(/[\r\n\s]+/g, '');

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
      return new Response(`Login failed: Google Token error: ${JSON.stringify(tokenData)}`, { status: 400 });
    }

    // Step 2: Token → User Info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    if (!googleUser || !googleUser.id) {
      return new Response('Login failed: Could not fetch Google user profile.', { status: 400 });
    }

    // Step 3: DB me user insert ya update karo
    let user = null;
    try {
      user = await env.DB.prepare(
        'SELECT id, email, name, google_id, avatar_url FROM users WHERE google_id = ? OR email = ?'
      ).bind(googleUser.id, googleUser.email).first();
    } catch (dbErr) {
      console.error('DB query error:', dbErr);
    }

    let referrerId = null;
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

    if (!user) {
      const cookie = request.headers.get('Cookie') || '';
      const referrerIdMatch = cookie.match(/(?:^|;\s*)ev_referrer=([^;]*)/);
      referrerId = referrerIdMatch ? parseInt(referrerIdMatch[1]) : null;

      let result;
      const insertUser = async (gId, uEmail, uName, uPic, ip, refId) => {
        try {
          if (refId) {
            return await env.DB.prepare(
              'INSERT INTO users (google_id, email, name, avatar_url, referred_by_id, referral_coins, signup_ip) VALUES (?, ?, ?, ?, ?, 100, ?)'
            ).bind(gId, uEmail, uName, uPic, refId, ip).run();
          }
          return await env.DB.prepare(
            'INSERT INTO users (google_id, email, name, avatar_url, signup_ip) VALUES (?, ?, ?, ?, ?)'
          ).bind(gId, uEmail, uName, uPic, ip).run();
        } catch (err) {
          // Fallback if signup_ip column missing
          return await env.DB.prepare(
            'INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)'
          ).bind(gId, uEmail, uName, uPic).run();
        }
      };

      if (referrerId) {
        let refUser = null;
        let existingIpUser = null;
        try {
          refUser = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(referrerId).first();
          existingIpUser = await env.DB.prepare('SELECT id FROM users WHERE signup_ip = ?').bind(clientIp).first();
        } catch (e) {}

        if (refUser && !existingIpUser) {
          result = await insertUser(googleUser.id, googleUser.email, googleUser.name, googleUser.picture || '', clientIp, referrerId);
          const newUserId = result.meta.last_row_id || result.insertId;

          try {
            await env.DB.prepare('UPDATE users SET referral_coins = referral_coins + 100 WHERE id = ?').bind(referrerId).run();
            await env.DB.prepare(
              'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 100, "signup_bonus", "Joined via referral link")'
            ).bind(newUserId).run();
            await env.DB.prepare(
              'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 100, "referral_signup", "Referred a friend (User ID: " || ? || ")")'
            ).bind(referrerId, newUserId).run();
          } catch (e) {}
        } else {
          referrerId = null;
          result = await insertUser(googleUser.id, googleUser.email, googleUser.name, googleUser.picture || '', clientIp, null);
        }
      } else {
        result = await insertUser(googleUser.id, googleUser.email, googleUser.name, googleUser.picture || '', clientIp, null);
      }
      user = { id: result.meta.last_row_id || result.insertId, email: googleUser.email, name: googleUser.name };
    } else {
      try {
        await env.DB.prepare(
          'UPDATE users SET google_id = ?, avatar_url = COALESCE(NULLIF(?, ""), avatar_url), name = COALESCE(NULLIF(name, ""), ?) WHERE id = ?'
        ).bind(googleUser.id, googleUser.picture || '', googleUser.name || '', user.id).run();
      } catch (e) {}
    }

    // Step 4: JWT Token banao (7 din valid)
    const jwtSecret = env.JWT_SECRET ? String(env.JWT_SECRET).trim() : 'ev_jwt_secret_key_prod_2026_safe_secure';
    const jwt = await createJWT({ userId: user.id, email: user.email }, jwtSecret, 7 * 24 * 60 * 60);

    // Read redirect URL from state
    let redirectTo = stateObj.redirect || '/profile/';
    redirectTo = validateRedirectUrl(redirectTo);

    // Step 5: Cookie set karke homepage/profile par redirect karo
    const headers = new Headers();
    headers.append('Location', redirectTo);
    headers.append('Set-Cookie', `ev_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
    headers.append('Set-Cookie', 'ev_oauth_csrf=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure');
    if (referrerId) {
      headers.append('Set-Cookie', 'ev_referrer=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure');
    }

    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error('Auth callback fatal error:', error);
    return new Response(`Auth Error: ${error.message || error}`, { status: 500 });
  }
}
