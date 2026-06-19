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
    const { password } = await request.json();
    if (!password || password.length < 6) {
      return Response.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    // 2. Hash Password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 3. Update DB
    await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .bind(password_hash, payload.userId)
      .run();

    return Response.json({ success: true, message: 'Password updated successfully!' });

  } catch (err) {
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
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
