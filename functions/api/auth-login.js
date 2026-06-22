export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { loginId, password } = await request.json();
    if (!loginId || !password) {
      return Response.json({ success: false, error: 'Email/UserID and password are required.' }, { status: 400 });
    }

    // Check if loginId is an email, username, or numeric ID
    let user;
    if (loginId.includes('@')) {
      user = await env.DB.prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?').bind(loginId).first();
    } else if (!isNaN(loginId)) {
      user = await env.DB.prepare('SELECT id, email, name, password_hash FROM users WHERE id = ?').bind(parseInt(loginId)).first();
    } else {
      user = await env.DB.prepare('SELECT id, email, name, password_hash FROM users WHERE username = ?').bind(loginId).first();
    }

    if (!user) {
      return Response.json({ success: false, error: 'Account not found.' }, { status: 404 });
    }

    if (!user.password_hash) {
      return Response.json({ success: false, error: 'You signed up with Google. Please login with Google, then set a password in Settings.' }, { status: 403 });
    }

    // Verify password (PBKDF2 with legacy SHA-256 fallback and auto-migration)
    let isValid = false;
    let needsUpgrade = false;

    if (user.password_hash.includes(':')) {
      isValid = await verifyPasswordPBKDF2(password, user.password_hash);
    } else {
      const legacyHash = await hashSHA256(password);
      isValid = (legacyHash === user.password_hash);
      if (isValid) {
        needsUpgrade = true;
      }
    }

    if (!isValid) {
      return Response.json({ success: false, error: 'Incorrect password.' }, { status: 401 });
    }

    if (needsUpgrade) {
      const newHash = await hashPasswordPBKDF2(password);
      await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, user.id).run();
    }

    // Create JWT
    const jwt = await createJWT({ userId: user.id, email: user.email }, env.JWT_SECRET, 7 * 24 * 60 * 60);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `ev_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
      }
    });

  } catch (err) {
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// --- PBKDF2 Hashing Helpers ---
async function hashPasswordPBKDF2(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    512
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

async function verifyPasswordPBKDF2(password, storedHashStr) {
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
  const derivedHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return derivedHex === hashHex;
}

async function hashSHA256(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
