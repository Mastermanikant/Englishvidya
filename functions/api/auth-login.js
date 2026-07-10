import { 
  hashPasswordPBKDF2, 
  verifyPasswordPBKDF2, 
  hashSHA256, 
  createJWT, 
  getGenericErrorMsg 
} from './_shared/auth-utils.js';

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

    let isValid = false;
    let needsUpgrade = false;

    if (user && user.password_hash) {
      if (user.password_hash.includes(':')) {
        isValid = await verifyPasswordPBKDF2(password, user.password_hash);
      } else {
        const legacyHash = await hashSHA256(password);
        isValid = (legacyHash === user.password_hash);
        if (isValid) {
          needsUpgrade = true;
        }
      }
    } else {
      // Dummy verification to prevent timing attack enumeration
      await verifyPasswordPBKDF2(password, '0123456789abcdef0123456789abcdef:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    }

    if (!isValid) {
      return Response.json({ success: false, error: 'Incorrect email/ID or password.' }, { status: 401 });
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
    return Response.json({ success: false, error: getGenericErrorMsg() }, { status: 500 });
  }
}
