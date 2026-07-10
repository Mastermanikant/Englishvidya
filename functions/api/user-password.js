import { 
  verifyJWT,
  hashPasswordPBKDF2, 
  verifyPasswordPBKDF2, 
  hashSHA256,
  getGenericErrorMsg
} from './_shared/auth-utils.js';

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
    return Response.json({ success: false, error: getGenericErrorMsg() }, { status: 500 });
  }
}
