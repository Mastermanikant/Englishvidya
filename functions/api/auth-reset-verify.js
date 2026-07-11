import { hashPasswordPBKDF2, verifyPasswordPBKDF2, hashSHA256, cryptoTimingSafeEqual } from './_shared/auth-utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const emailOrUsername = url.searchParams.get('email');

  if (!code || !code.trim() || !emailOrUsername || !emailOrUsername.trim()) {
    return Response.json({ error: 'ओटीपी कोड और ईमेल/यूज़रनेम प्रदान करना आवश्यक है।' }, { status: 400 });
  }

  try {
    const cleanInput = emailOrUsername.trim();
    let user;

    if (cleanInput.includes('@')) {
      user = await env.DB.prepare(
        'SELECT id, security_questions, reset_token, reset_token_expires_at, reset_attempts FROM users WHERE email = ?'
      ).bind(cleanInput.toLowerCase()).first();
    } else {
      user = await env.DB.prepare(
        'SELECT id, security_questions, reset_token, reset_token_expires_at, reset_attempts FROM users WHERE username = ?'
      ).bind(cleanInput).first();
    }

    if (!user || user.reset_token !== code.trim()) {
      if (user && user.reset_token) {
        // Increment attempts on incorrect code for specific user
        await env.DB.prepare('UPDATE users SET reset_attempts = reset_attempts + 1 WHERE id = ?').bind(user.id).run();
      }
      return Response.json({ error: 'अमान्य रीसेट कोड दर्ज किया गया है या ईमेल गलत है।' }, { status: 400 });
    }

    // 2. Check failed attempts limit (max 5)
    if (user.reset_attempts >= 5) {
      await env.DB.prepare('UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?')
        .bind(user.id)
        .run();
      return Response.json(
        { error: 'सुरक्षा कारणों से यह कोड ब्लॉक कर दिया गया है क्योंकि बहुत सारे गलत प्रयास किए गए। कृपया नया कोड प्राप्त करें।' },
        { status: 400 }
      );
    }

    // 3. Check expiry (15 mins)
    if (user.reset_token_expires_at && new Date(user.reset_token_expires_at).getTime() < Date.now()) {
      await env.DB.prepare('UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?')
        .bind(user.id)
        .run();
      return Response.json({ error: 'इस कोड की समय सीमा (15 मिनट) समाप्त हो चुकी है। कृपया नया कोड प्राप्त करें।' }, { status: 400 });
    }

    // 4. Return safety clean questions
    let questions = [];
    if (user.security_questions) {
      try {
        const parsed = JSON.parse(user.security_questions);
        if (Array.isArray(parsed)) {
          questions = parsed.map(q => ({
            question: q.question,
            is_custom: !!q.is_custom
          }));
        }
      } catch (e) {
        questions = [];
      }
    }

    if (questions.length === 0) {
      return Response.json({
        success: true,
        noSecurityQuestions: true,
        message: 'आपने सुरक्षा प्रश्न सेट नहीं किए हैं। कृपया एडमिन से संपर्क करके पासवर्ड रीसेट का अनुरोध करें।'
      });
    }

    return Response.json({
      success: true,
      questions
    });

  } catch (err) {
    return Response.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email, code, answers, newPassword } = await request.json();

    if (!email || !email.trim() || !code || !code.trim() || !newPassword || newPassword.length < 6) {
      return Response.json({ error: 'ईमेल, कोड और वैध नया पासवर्ड (कम से कम ६ अक्षर) होना आवश्यक है।' }, { status: 400 });
    }

    const cleanInput = email.trim();
    let user;

    if (cleanInput.includes('@')) {
      user = await env.DB.prepare(
        'SELECT id, security_questions, reset_token, reset_token_expires_at, reset_attempts FROM users WHERE email = ?'
      ).bind(cleanInput.toLowerCase()).first();
    } else {
      user = await env.DB.prepare(
        'SELECT id, security_questions, reset_token, reset_token_expires_at, reset_attempts FROM users WHERE username = ?'
      ).bind(cleanInput).first();
    }

    if (!user || user.reset_token !== code.trim()) {
      if (user && user.reset_token) {
        // Increment attempts on incorrect code
        await env.DB.prepare('UPDATE users SET reset_attempts = reset_attempts + 1 WHERE id = ?').bind(user.id).run();
      }
      return Response.json({ error: 'अमान्य रीसेट कोड या ईमेल।' }, { status: 400 });
    }

    // 2. Check failed attempts limit (max 5)
    if (user.reset_attempts >= 5) {
      await env.DB.prepare('UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?')
        .bind(user.id)
        .run();
      return Response.json(
        { error: 'सुरक्षा कारणों से यह कोड ब्लॉक कर दिया गया है। कृपया नया रीसेट लिंक मंगवाएं।' },
        { status: 400 }
      );
    }

    // 3. Check expiry
    if (user.reset_token_expires_at && new Date(user.reset_token_expires_at).getTime() < Date.now()) {
      await env.DB.prepare('UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?')
        .bind(user.id)
        .run();
      return Response.json({ error: 'इस कोड की वैधता समाप्त हो चुकी है।' }, { status: 400 });
    }

    // 4. Verify Security Answers
    let dbQuestions = [];
    if (user.security_questions) {
      try {
        dbQuestions = JSON.parse(user.security_questions);
      } catch (e) {
        dbQuestions = [];
      }
    }

    if (!Array.isArray(dbQuestions) || dbQuestions.length === 0) {
      return Response.json({ error: 'आपने सुरक्षा प्रश्न सेट नहीं किए हैं। कृपया एडमिन रीसेट का अनुरोध करें।' }, { status: 400 });
    }

    if (!Array.isArray(answers) || answers.length < 2) {
      return Response.json({ error: 'कृपया कम से कम २ सुरक्षा प्रश्नों के उत्तर दर्ज करें।' }, { status: 400 });
    }

    // Verify each provided answer
    let matchedCount = 0;

    for (const ansObj of answers) {
      const { question, answer } = ansObj;
      if (!question || !answer || !answer.trim()) continue;

      const cleanInputQ = question.trim().toLowerCase();
      const cleanInputA = answer.trim().toLowerCase().replace(/\s+/g, '');

      // Find question in database questions list
      const dbQ = dbQuestions.find(dq => dq.question.trim().toLowerCase() === cleanInputQ);
      if (!dbQ || !dbQ.answer_hash) continue;

      let isValid = false;
      if (dbQ.answer_hash.includes(':')) {
        isValid = await verifyPasswordPBKDF2(cleanInputA, dbQ.answer_hash);
      } else {
        const inputHash = await hashSHA256(cleanInputA);
        isValid = cryptoTimingSafeEqual(inputHash, dbQ.answer_hash);
      }

      if (isValid) {
        matchedCount++;
      }
    }

    // Check if at least 2 match
    if (matchedCount < 2) {
      // Increment failed attempts
      const newAttempts = (user.reset_attempts || 0) + 1;
      if (newAttempts >= 5) {
        await env.DB.prepare('UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL, reset_attempts = 5 WHERE id = ?')
          .bind(user.id)
          .run();
        return Response.json({ error: 'सुरक्षा प्रश्नों के गलत उत्तर। आपका कोड ब्लॉक हो गया है, कृपया नया कोड मंगवाएं।' }, { status: 400 });
      } else {
        await env.DB.prepare('UPDATE users SET reset_attempts = ? WHERE id = ?')
          .bind(newAttempts, user.id)
          .run();
        return Response.json({ error: `सुरक्षा प्रश्नों के उत्तर सही नहीं हैं। आपके पास ${5 - newAttempts} प्रयास और शेष हैं।` }, { status: 400 });
      }
    }

    // 5. Answers matched! Hash new password using PBKDF2
    const password_hash = await hashPasswordPBKDF2(newPassword);

    // 6. Update user's password and clear reset state
    await env.DB.prepare(
      `UPDATE users 
       SET password_hash = ?, 
           reset_token = NULL, 
           reset_token_expires_at = NULL, 
           reset_attempts = 0 
       WHERE id = ?`
    )
      .bind(password_hash, user.id)
      .run();

    return Response.json({ success: true, message: 'आपका पासवर्ड सफलतापूर्वक बदल दिया गया है! अब आप लॉगिन कर सकते हैं।' });

  } catch (err) {
    return Response.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 });
  }
}
