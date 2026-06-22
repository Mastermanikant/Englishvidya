export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { emailOrUsername, sendTo } = await request.json();

    if (!emailOrUsername || !emailOrUsername.trim()) {
      return Response.json({ error: 'ईमेल या यूज़रनेम दर्ज करना आवश्यक है।' }, { status: 400 });
    }

    const cleanInput = emailOrUsername.trim();

    // 1. Search for user by email or username
    let user;
    if (cleanInput.includes('@')) {
      user = await env.DB.prepare(
        'SELECT id, email, recovery_email, reset_request_timestamps FROM users WHERE email = ?'
      ).bind(cleanInput.toLowerCase()).first();
    } else {
      user = await env.DB.prepare(
        'SELECT id, email, recovery_email, reset_request_timestamps FROM users WHERE username = ?'
      ).bind(cleanInput).first();
    }

    if (!user) {
      return Response.json({ error: 'यह ईमेल या यूज़रनेम हमारे सिस्टम में मौजूद नहीं है।' }, { status: 404 });
    }

    // 2. Check if user has backup recovery email
    const hasRecoveryEmail = !!(user.recovery_email && user.recovery_email.trim());

    // If sendTo is not provided and user has a recovery email, require user to choose
    if (!sendTo && hasRecoveryEmail) {
      return Response.json({
        success: true,
        requireChoice: true,
        primaryEmail: obfuscateEmail(user.email),
        recoveryEmail: obfuscateEmail(user.recovery_email)
      });
    }

    // Determine target email
    let targetEmail = user.email;
    let targetLabel = 'Primary Email';
    if (sendTo === 'recovery' && hasRecoveryEmail) {
      targetEmail = user.recovery_email;
      targetLabel = 'Backup Recovery Email';
    }

    // 3. Rate Limit Check (Max 2 requests in 24 hours)
    let timestamps = [];
    if (user.reset_request_timestamps) {
      try {
        timestamps = JSON.parse(user.reset_request_timestamps);
      } catch (e) {
        timestamps = [];
      }
    }

    const nowMs = Date.now();
    const twentyFourHoursAgoMs = nowMs - 24 * 60 * 60 * 1000;

    // Filter out old timestamps
    timestamps = timestamps.filter(ts => new Date(ts).getTime() > twentyFourHoursAgoMs);

    if (timestamps.length >= 2) {
      return Response.json(
        { error: 'सुरक्षा कारणों से, आप 24 घंटे में केवल 2 बार ही रीसेट कोड भेज सकते हैं।' },
        { status: 429 }
      );
    }

    // 4. Generate 6-digit Numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(nowMs + 30 * 60 * 60 * 1000).toISOString(); // 30 hours valid

    // Add current timestamp to rate limiting list
    timestamps.push(new Date(nowMs).toISOString());

    // 5. Update Database
    await env.DB.prepare(
      `UPDATE users 
       SET reset_token = ?, 
           reset_token_expires_at = ?, 
           reset_attempts = 0, 
           reset_request_timestamps = ? 
       WHERE id = ?`
    )
      .bind(otp, expiryTime, JSON.stringify(timestamps), user.id)
      .run();

    // 6. Simulate email sending
    const siteUrl = env.SITE_URL || new URL(request.url).origin;
    const resetLink = `${siteUrl}/reset-password/?code=${otp}`;

    console.log(`[EMAIL SIMULATION] Sending password reset details to ${targetEmail} (${targetLabel})`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Reset Link: ${resetLink}`);

    // Return success message
    const responsePayload = {
      success: true,
      requireChoice: false,
      sentTo: obfuscateEmail(targetEmail),
      message: `पासवर्ड रीसेट कोड सफलतापूर्वक ${obfuscateEmail(targetEmail)} पर भेज दिया गया है!`
    };

    // Include debug info only in localhost / development mode
    const isLocalhost = request.url.includes('localhost') || request.url.includes('127.0.0.1');
    if (isLocalhost) {
      responsePayload.devMode = true;
      responsePayload.devOtp = otp;
      responsePayload.devResetLink = resetLink;
    }

    return Response.json(responsePayload);

  } catch (err) {
    console.error('Password reset request error:', err);
    return Response.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}

function obfuscateEmail(email) {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name.substring(0, 2)}***${name.slice(-1)}@${domain}`;
}
