import { hashPasswordPBKDF2, createJWT, getGenericErrorMsg } from './_shared/auth-utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { name, email, username, password } = await request.json();

    if (!name || !email || !username || !password || password.length < 6) {
      return Response.json({ success: false, error: 'All fields are required and password must be at least 6 characters.' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ? OR username = ?'
    ).bind(email, username).first();

    if (existingUser) {
      return Response.json({ success: false, error: 'Email or username is already taken.' }, { status: 409 });
    }

    // Hash password securely
    const passwordHash = await hashPasswordPBKDF2(password);

    // Check for referral cookie
    const cookie = request.headers.get('Cookie') || '';
    const referrerIdMatch = cookie.match(/(?:^|;\s*)ev_referrer=([^;]*)/);
    let referrerId = referrerIdMatch ? parseInt(referrerIdMatch[1]) : null;

    let result;
    if (referrerId) {
      // Validate referrer ID
      const refUser = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(referrerId).first();
      if (refUser) {
        result = await env.DB.prepare(
          'INSERT INTO users (email, username, name, password_hash, referred_by_id, referral_coins) VALUES (?, ?, ?, ?, ?, 100)'
        ).bind(email, username, name, passwordHash, referrerId).run();
        
        const newUserId = result.meta.last_row_id || result.insertId;

        // Credit 100 coins (₹1) to Referrer
        await env.DB.prepare('UPDATE users SET referral_coins = referral_coins + 100 WHERE id = ?').bind(referrerId).run();

        // Log transaction for new user
        await env.DB.prepare(
          'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 100, "signup_bonus", "Joined via referral link")'
        ).bind(newUserId).run();

        // Log transaction for referrer
        await env.DB.prepare(
          'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 100, "referral_signup", "Referred a friend (User ID: " || ? || ")")'
        ).bind(referrerId, newUserId).run();
      } else {
        referrerId = null; // Reset if invalid
      }
    }
    
    if (!referrerId) {
      result = await env.DB.prepare(
        'INSERT INTO users (email, username, name, password_hash) VALUES (?, ?, ?, ?)'
      ).bind(email, username, name, passwordHash).run();
    }

    const newUserId = result.meta.last_row_id || result.insertId;

    // Create JWT
    const jwt = await createJWT({ userId: newUserId, email }, env.JWT_SECRET, 7 * 24 * 60 * 60);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Set-Cookie', `ev_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
    if (referrerId) {
      // Clear referral cookie
      headers.append('Set-Cookie', 'ev_referrer=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: headers
    });

  } catch (err) {
    return Response.json({ success: false, error: getGenericErrorMsg() }, { status: 500 });
  }
}
