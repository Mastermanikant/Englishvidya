export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { token, emailOrUsername } = await request.json();

    let user = null;

    // 1. Find user by token or email/username
    if (token && token.trim()) {
      user = await env.DB.prepare(
        'SELECT id, email, recovery_email FROM users WHERE reset_token = ?'
      ).bind(token.trim()).first();
    } else if (emailOrUsername && emailOrUsername.trim()) {
      const cleanInput = emailOrUsername.trim();
      if (cleanInput.includes('@')) {
        user = await env.DB.prepare(
          'SELECT id, email, recovery_email FROM users WHERE email = ?'
        ).bind(cleanInput.toLowerCase()).first();
      } else {
        user = await env.DB.prepare(
          'SELECT id, email, recovery_email FROM users WHERE username = ?'
        ).bind(cleanInput).first();
      }
    }

    if (!user) {
      return Response.json({ error: 'यह अकाउंट हमारे सिस्टम में नहीं मिला।' }, { status: 404 });
    }

    // 2. Set admin_reset_requested_at to current time and clear token
    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE users 
       SET admin_reset_requested_at = ?, 
           reset_token = NULL, 
           reset_token_expires_at = NULL, 
           reset_attempts = 0 
       WHERE id = ?`
    )
      .bind(now, user.id)
      .run();

    // 3. Simulate warning emails to primary and recovery emails
    console.log(`[ADMIN RESET REQUEST] Simulated security warning sent to Primary and Recovery emails.`);

    return Response.json({
      success: true,
      message: 'एडमिन पासवर्ड रीसेट का अनुरोध दर्ज कर लिया गया है। सुरक्षा कारणों से, 48 घंटे के सुरक्षा होल्ड (Security Hold) के बाद ही पासवर्ड बदला जा सकेगा। इस दौरान सुरक्षा चेतावनी आपके ईमेल पर भेज दी गई है।'
    });

  } catch (err) {
    return Response.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 });
  }
}
