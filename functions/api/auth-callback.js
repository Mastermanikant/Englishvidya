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

  if (!user) {
    // Naya user — insert karo
    const result = await env.DB.prepare(
      'INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)'
    ).bind(googleUser.id, googleUser.email, googleUser.name, googleUser.picture || '').run();
    user = { id: result.meta.last_row_id, email: googleUser.email, name: googleUser.name };
  }

  // Step 4: JWT Token banao (7 din valid)
  const jwt = await createJWT({ userId: user.id, email: user.email }, env.JWT_SECRET, 7 * 24 * 60 * 60);

  // Read redirect URL from state
  const state = url.searchParams.get('state');
  const redirectTo = state ? decodeURIComponent(state) : '/';

  // Step 5: Cookie set karke homepage par redirect karo
  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectTo,
      'Set-Cookie': `ev_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
    },
  });
}

// --- Helper: JWT Create (HMAC-SHA256) ---
async function createJWT(payload, secret, expiresInSeconds) {
  const header = { alg: 'HS256', typ: 'JWT' };
  payload.exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  payload.iat = Math.floor(Date.now() / 1000);

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const data = headerB64 + '.' + payloadB64;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return data + '.' + sigB64;
}
