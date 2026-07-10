import { 
  verifyPasswordPBKDF2, 
  createJWT, 
  validateRedirectUrl,
  getGenericErrorMsg
} from './_shared/auth-utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const data = await request.formData();
    const username = data.get('username');
    const password = data.get('password');
    let redirectTo = data.get('redirect_to') || '/admin/';
    
    // Security: Validate the redirect URL to prevent Open Redirect
    redirectTo = validateRedirectUrl(redirectTo);

    if (!username || !password) {
      return new Response('Username and password required', { status: 400 });
    }

    // 1. Fetch User
    const user = await env.DB.prepare(
      'SELECT id, email, username, password_hash, role FROM users WHERE username = ?'
    ).bind(username).first();

    let isValid = false;
    if (user && user.password_hash) {
      isValid = await verifyPasswordPBKDF2(password, user.password_hash);
    } else {
      // Dummy check to prevent timing attack
      await verifyPasswordPBKDF2(password, '0123456789abcdef0123456789abcdef:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    }

    if (!isValid) {
      return new Response('Invalid credentials', { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'admin') {
      return new Response('Access denied', { status: 403 });
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
    return new Response(getGenericErrorMsg(), { status: 500 });
  }
}
