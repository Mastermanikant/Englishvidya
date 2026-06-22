export async function onRequestPost(context) {
  const { request, env } = context;
  
  // 1. Verify User is Logged In
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/ev_token=([^;]+)/);
  if (!match) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const token = match[1];
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return Response.json({ error: 'Invalid token' }, { status: 401 });

  try {
    const { currentPassword, password } = await request.json();
    if (!password || password.length < 6) {
      return Response.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    // Fetch user's current password hash from DB
    const user = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(payload.userId).first();
    if (!user) {
      return Response.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    // If user has an existing password, verify it first
    if (user.password_hash) {
      if (!currentPassword) {
        return Response.json({ success: false, error: 'सुरक्षा के लिए वर्तमान पासवर्ड दर्ज करना आवश्यक है।' }, { status: 400 });
      }

      let isCurrentValid = false;
      if (user.password_hash.includes(':')) {
        isCurrentValid = await verifyPasswordPBKDF2(currentPassword, user.password_hash);
      } else {
        const legacyHash = await hashSHA256(currentPassword);
        isCurrentValid = (legacyHash === user.password_hash);
      }

      if (!isCurrentValid) {
        return Response.json({ success: false, error: 'गलत वर्तमान पासवर्ड दर्ज किया गया है।' }, { status: 401 });
      }
    }

    // 2. Hash New Password using PBKDF2
    const password_hash = await hashPasswordPBKDF2(password);

    // 3. Update DB
    await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .bind(password_hash, payload.userId)
      .run();

    return Response.json({ success: true, message: 'Password updated successfully!' });

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

// --- Helper: Verify JWT ---
async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const data = parts[0] + '.' + parts[1];
    const signature = parts[2];

    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );

    const sigBuf = new Uint8Array(atob(signature.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0)));
    
    const isValid = await crypto.subtle.verify('HMAC', key, sigBuf, new TextEncoder().encode(data));
    if (!isValid) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch (e) {
    return null;
  }
}
