import { verifyJWT } from './api/_shared/auth-utils.js';

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
        if (env.DB && typeof env.DB.prepare === 'function') {
          const referrer = await env.DB.prepare('SELECT id FROM users WHERE LOWER(username) = ?').bind(username).first();
          if (referrer) {
            const headers = new Headers();
            headers.append('Location', '/');
            headers.append('Set-Cookie', `ev_referrer=${referrer.id}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax; Secure`);
            return new Response('', { status: 302, headers });
          }
        }
      } catch (err) {
        // Fail silently
      }
    }
  }

  const cookie = request.headers.get('Cookie') || '';
  const tokens = getAllCookieValues(cookie, 'ev_token');

  context.data = context.data || {};
  context.data.user = null;

  for (const token of tokens) {
    if (!token) continue;
    try {
      const jwtSecret = env.JWT_SECRET ? String(env.JWT_SECRET).trim() : 'ev_jwt_secret_key_prod_2026_safe_secure';
      const payload = await verifyJWT(token, jwtSecret);
      
      if (payload && (payload.userId || payload.email)) {
        // Fallback user from JWT directly
        let userObj = {
          id: payload.userId || 1,
          name: payload.name || 'Student',
          email: payload.email || '',
          avatar_url: payload.avatar_url || '',
          role: payload.role || 'learner'
        };

        // If D1 is available, try enriching from DB
        try {
          if (env.DB && typeof env.DB.prepare === 'function') {
            const dbUser = await env.DB.prepare(
              'SELECT * FROM users WHERE id = ? OR (email = ? AND ? != "")'
            ).bind(payload.userId || 0, payload.email || '', payload.email || '').first();

            if (dbUser) {
              userObj = { ...userObj, ...dbUser };
            }
          }
        } catch (dbError) {
          // Keep fallback user from JWT
        }

        context.data.user = userObj;
        break;
      }
    } catch (e) {
      console.error('[EV Middleware] JWT error:', e);
    }
  }

  return context.next();
}

function getAllCookieValues(cookieString, name) {
  if (!cookieString) return [];
  const regex = new RegExp('(?:^|;\\s*)' + name + '=([^;]*)', 'g');
  const values = [];
  let match;
  while ((match = regex.exec(cookieString)) !== null) {
    try {
      const val = decodeURIComponent(match[1]).replace(/^"|"$/g, '').trim();
      if (val) values.push(val);
    } catch (e) {
      const val = match[1].replace(/^"|"$/g, '').trim();
      if (val) values.push(val);
    }
  }
  return values;
}
