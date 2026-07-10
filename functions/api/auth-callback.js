import { createJWT, validateRedirectUrl } from './_shared/auth-utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Login failed: No code received', { status: 400 });
  }

  // Step 1: Code → Token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.SITE_URL}/api/auth-callback`,
      grant_type: 'authorization_code',
    }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return new Response('Login failed: No access token', { status: 400 });
  }

  // Step 2: Token → User Info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const googleUser = await userRes.json();

  // Step 3: DB me user insert ya update karo
  let user = await env.DB.prepare(
    'SELECT id, email, name, google_id FROM users WHERE google_id = ?'
  ).bind(googleUser.id).first();

  let referrerId = null;
  if (!user) {
    // Check for referral cookie
    const cookie = request.headers.get('Cookie') || '';
    const referrerIdMatch = cookie.match(/(?:^|;\s*)ev_referrer=([^;]*)/);
    referrerId = referrerIdMatch ? parseInt(referrerIdMatch[1]) : null;

    let result;
    if (referrerId) {
      // Validate referrer ID
      const refUser = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(referrerId).first();
      if (refUser) {
        result = await env.DB.prepare(
          'INSERT INTO users (google_id, email, name, avatar_url, referred_by_id, referral_coins) VALUES (?, ?, ?, ?, ?, 100)'
        ).bind(googleUser.id, googleUser.email, googleUser.name, googleUser.picture || '', referrerId).run();
        
        const newUserId = result.meta.last_row_id || result.insertId;

        // Credit 100 coins (₹1) to Referrer
        await env.DB.prepare('UPDATE users SET referral_coins = referral_coins + 100 WHERE id = ?').bind(referrerId).run();

        // Log transaction for new user
        await env.DB.prepare(
          'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 100, "signup_bonus", "Joined via referral link")'
        ).bind(newUserId).run();

        // Log transaction for referrer
        await env.DB.prepare(
          'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 100, "referral_signup", "Referred a friend (User ID: " || ? || ")")'
        ).bind(referrerId, newUserId).run();
      } else {
        referrerId = null; // Reset if invalid
        result = await env.DB.prepare(
          'INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)'
        ).bind(googleUser.id, googleUser.email, googleUser.name, googleUser.picture || '').run();
      }
    } else {
      result = await env.DB.prepare(
        'INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)'
      ).bind(googleUser.id, googleUser.email, googleUser.name, googleUser.picture || '').run();
    }
    user = { id: result.meta.last_row_id || result.insertId, email: googleUser.email, name: googleUser.name };
  }

  // Step 4: JWT Token banao (7 din valid)
  const jwt = await createJWT({ userId: user.id, email: user.email }, env.JWT_SECRET, 7 * 24 * 60 * 60);

  // Read redirect URL from state
  const state = url.searchParams.get('state');
  let redirectTo = state ? decodeURIComponent(state) : '/';
  
  // Security: Validate redirect URL
  redirectTo = validateRedirectUrl(redirectTo);

  // Step 5: Cookie set karke homepage par redirect karo
  const headers = new Headers();
  headers.append('Location', redirectTo);
  headers.append('Set-Cookie', `ev_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
  if (referrerId) {
    // Clear referral cookie
    headers.append('Set-Cookie', 'ev_referrer=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure');
  }

  return new Response(null, {
    status: 302,
    headers: headers
  });
}

