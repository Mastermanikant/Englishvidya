export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // SEO: Redirect .pages.dev and www. to the main domain to prevent duplicate content
  if (url.hostname.endsWith('.pages.dev') || url.hostname === 'www.englishvidya.com') {
    url.hostname = 'englishvidya.com';
    return Response.redirect(url.toString(), 301);
  }

  const cookie = request.headers.get('Cookie') || '';
  const token = getCookieValue(cookie, 'ev_token');

  context.data = context.data || {};
  context.data.user = null;

  if (token) {
    try {
      const payload = await verifyJWT(token, env.JWT_SECRET);
      
      const user = await env.DB.prepare(
        'SELECT id, google_id, email, name, username, role, avatar_url, trust_score, is_shadow_banned, daily_sync_count, monthly_sync_count, last_sync_date, last_sync_month FROM users WHERE id = ?'
      ).bind(payload.userId).first();

      if (user) {
        context.data.user = user;
      }
    } catch (e) {
      // Invalid/expired token — ignore, user stays null
    }
  }

  return context.next();
}

function getCookieValue(cookieString, name) {
  const match = cookieString.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? match[1] : null;
}

async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const [headerB64, payloadB64, signatureB64] = parts;
  const data = headerB64 + '.' + payloadB64;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = base64UrlDecode(signatureB64);
  const valid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(data));

  if (!valid) throw new Error('Invalid signature');

  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

function base64UrlDecode(str) {
  let padded = str.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4) padded += '=';
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
