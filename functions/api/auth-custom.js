export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const data = await request.formData();
    const username = data.get('username');
    const password = data.get('password');
    const redirectTo = data.get('redirect_to') || '/admin/';

    if (!username || !password) {
      return new Response('Username and password required', { status: 400 });
    }

    // 1. Fetch User
    const user = await env.DB.prepare(
      'SELECT id, email, username, password_hash, role FROM users WHERE username = ?'
    ).bind(username).first();

    if (!user || !user.password_hash) {
      return new Response('Invalid credentials', { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'admin') {
      return new Response('Access denied', { status: 403 });
    }

    // 2. Verify Password (PBKDF2)
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return new Response('Invalid credentials', { status: 401 });
    }

    // 3. Create JWT
    const jwt = await createJWT({ userId: user.id, email: user.email, role: user.role }, env.JWT_SECRET, 7 * 24 * 60 * 60);

    // 4. Set Cookie & Redirect
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectTo,
        'Set-Cookie': `ev_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
      },
    });
  } catch (error) {
    return new Response('Server Error', { status: 500 });
  }
}

async function verifyPassword(password, storedHashStr) {
  const parts = storedHashStr.split(':');
  if (parts.length !== 2) return false;
  
  const [saltHex, hashHex] = parts;
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    { name: 'PBKDF2' }, false, ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    512
  );
  
  const derivedHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0')).join('');
    
  return derivedHex === hashHex;
}

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
