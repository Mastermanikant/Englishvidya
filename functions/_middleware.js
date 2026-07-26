export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // SEO: Redirect .pages.dev and www. to the main domain to prevent duplicate content
  if (url.hostname.endsWith('.pages.dev') || url.hostname === 'www.englishvidya.com') {
    url.hostname = 'englishvidya.com';
    return Response.redirect(url.toString(), 301);
  }

  // Referral URL routing: englishvidya.com/username
  const pathname = url.pathname;
  const segments = pathname.split('/').filter(Boolean);
  if (request.method === 'GET' && segments.length === 1) {
    const username = segments[0].toLowerCase();
    const reserved = [
      'admin', 'api', 'assets', 'css', 'js', 'dictionary', 'grammar', 
      'legal', 'legal-hindi', 'settings', 'login', 'signup', 'register', 'contact', 'profile', 
      'about-us', 'about-us-hindi', 'forum', 'my-diary', 'founder-mastermanikant', 
      'founder-mastermanikant-hindi', 'class-10', 'class-12', 'flashcards', 
      'robots.txt', 'manifest.json', 'sitemap.xml', 'favicon.ico', 'paid', 'iamkingofev'
    ];
    
    if (!reserved.includes(username) && /^[a-z0-9_-]{3,20}$/.test(username)) {
      try {
        const referrer = await env.DB.prepare('SELECT id FROM users WHERE LOWER(username) = ?').bind(username).first();
        if (referrer) {
          const headers = new Headers();
          headers.append('Location', '/');
          // Cookie expires in 30 days
          headers.append('Set-Cookie', `ev_referrer=${referrer.id}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax; Secure`);
          return new Response('', { status: 302, headers });
        }
      } catch (err) {
        // Fail silently to ensure main site functionality is not affected by database glitches
      }
    }
  }

  const cookie = request.headers.get('Cookie') || '';
  const token = getCookieValue(cookie, 'ev_token');

  context.data = context.data || {};
  context.data.user = null;

  if (token) {
    try {
      const jwtSecret = env.JWT_SECRET ? String(env.JWT_SECRET).trim() : 'ev_jwt_secret_key_prod_2026_safe_secure';
      const payload = await verifyJWT(token, jwtSecret);
      
      if (payload && payload.userId) {
        const user = await env.DB.prepare(
          'SELECT id, google_id, email, name, username, role, avatar_url, password_hash, trust_score, is_shadow_banned, daily_sync_count, monthly_sync_count, last_sync_date, last_sync_month, social_instagram, social_facebook, social_youtube, social_twitter, social_linkedin, social_pinterest, social_website1, social_website2, delete_requested_at, has_accepted_rules, location_address FROM users WHERE id = ?'
        ).bind(payload.userId).first();

        if (user) {
          context.data.user = user;
        }
      }
    } catch (e) {
      console.error('[EV Middleware] JWT Verification error:', e);
    }
  }

  return context.next();
}

function getCookieValue(cookieString, name) {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]).replace(/^"|"$/g, '').trim();
  } catch (e) {
    return match[1].replace(/^"|"$/g, '').trim();
  }
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

  const payload = JSON.parse(base64UrlDecodeText(payloadB64));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

function base64UrlDecodeText(str) {
  let padded = str.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4) padded += '=';
  return atob(padded);
}

function base64UrlDecode(str) {
  let padded = str.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4) padded += '=';
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
