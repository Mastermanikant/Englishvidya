async function signJWT(payload, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return new Response('Missing code', { status: 400 });
  }
  
  const clientId = env.GOOGLE_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID';
  const clientSecret = env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER_CLIENT_SECRET';
  const redirectUri = new URL('/auth/callback', request.url).toString();
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });
  
  const tokenData = await tokenResponse.json();
  if (tokenData.error) {
    return new Response('Error exchanging token: ' + tokenData.error, { status: 400 });
  }
  
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  
  const userData = await userResponse.json();
  if (!userData.id) {
    return new Response('Failed to get user info', { status: 400 });
  }
  
  const db = env.DB;
  const existingUser = await db.prepare('SELECT * FROM users WHERE google_id = ?').bind(userData.id).first();
  
  let userId;
  let role = 'user';
  if (existingUser) {
    userId = existingUser.id;
    role = existingUser.role;
    await db.prepare('UPDATE users SET email = ?, name = ?, avatar_url = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(userData.email, userData.name, userData.picture, userId).run();
  } else {
    const result = await db.prepare(`
      INSERT INTO users (google_id, email, name, avatar_url, role) 
      VALUES (?, ?, ?, ?, 'user') RETURNING id, role
    `).bind(userData.id, userData.email, userData.name, userData.picture || '').first();
    userId = result.id;
    role = result.role;
  }
  
  const jwtSecret = env.JWT_SECRET || 'DEFAULT_SECRET_CHANGE_ME';
  const token = await signJWT({ id: userId, role, email: userData.email, exp: Math.floor(Date.now()/1000) + 86400 }, jwtSecret);
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': `token=${token}; HttpOnly; Secure; Path=/; Max-Age=86400; SameSite=Strict`
    }
  });
}
