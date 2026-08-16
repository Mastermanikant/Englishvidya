async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const data = encoder.encode(`${parts[0]}.${parts[1]}`);
  let signatureBytes;
  try {
    signatureBytes = Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  } catch (e) {
    return null;
  }
  
  const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, data);
  if (!isValid) return null;
  
  const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
  try {
    const payload = JSON.parse(payloadStr);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const cookieHeader = request.headers.get('Cookie');
  let token = null;
  
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;)\s*token=([^;]+)/);
    if (match) token = match[1];
  }
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const jwtSecret = env.JWT_SECRET || 'DEFAULT_SECRET_CHANGE_ME';
  const payload = await verifyJWT(token, jwtSecret);
  
  if (!payload || (payload.role !== 'admin' && payload.role !== 'owner')) {
    return new Response('Forbidden', { status: 403 });
  }
  
  context.data = { user: payload };
  return next();
}
