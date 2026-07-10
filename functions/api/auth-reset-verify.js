import { hashPasswordPBKDF2, hashSHA256 } from './_shared/auth-utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code || !code.trim()) {
    return Response.json({ error: 'ओटीपी कोड प्रदान करना आवश्यक है।' }, { status: 400 });
  }

  try {
    // 1. Fetch user by reset_token
    const user = await env.DB.prepare(
      'SELECT id, security_questions, reset_token_expires_at, reset_attempts FROM users WHERE reset_token = ?'
    ).bind(code.trim()).first();

    if (!user) {
      return Response.json({ error: 'अमान्य रीसेट कोड दर्ज किया गया है।' }, { status: 400 });
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

    // 3. Check expiry (30 hours)
    if (user.reset_token_expires_at && new Date(user.reset_token_expires_at).getTime() < Date.now()) {
      await env.DB.prepare('UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?')
        .bind(user.id)
        .run();
      return Response.json({ error: 'इस कोड की समय सीमा (30 घंटे) समाप्त हो चुकी है। कृपया नया कोड प्राप्त करें।' }, { status: 400 });
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
    const { code, answers, newPassword } = await request.json();

    if (!code || !code.trim() || !newPassword || newPassword.length < 6) {
      return Response.json({ error: 'कोड और वैध नया पासवर्ड (कम से कम ६ अक्षर) होना आवश्यक है।' }, { status: 400 });
    }

    // 1. Fetch user by reset_token
    const user = await env.DB.prepare(
      'SELECT id, security_questions, reset_token_expires_at, reset_attempts FROM users WHERE reset_token = ?'
    ).bind(code.trim()).first();

    if (!user) {
      return Response.json({ error: 'अमान्य रीसेट कोड।' }, { status: 400 });
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

      // Hash input answer using shared SHA-256
      const inputHash = await hashSHA256(cleanInputA);

      if (inputHash === dbQ.answer_hash) {
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
