import { hashPasswordPBKDF2 } from './_shared/auth-utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = context.data.user;
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recoveryEmail, questions } = await request.json();

    if (!Array.isArray(questions) || questions.length !== 3) {
      return Response.json({ error: '3 security questions are required.' }, { status: 400 });
    }

    // Fetch existing questions to check if we can reuse hashes
    const existingUser = await env.DB.prepare('SELECT security_questions FROM users WHERE id = ?').bind(user.id).first();
    const existingQs = existingUser && existingUser.security_questions ? JSON.parse(existingUser.security_questions) : [];

    const processedQuestions = [];
    for (let i = 0; i < 3; i++) {
      const q = questions[i];
      if (!q) {
        return Response.json({ error: '3 security questions are required.' }, { status: 400 });
      }
      const { question, answer, isCustom } = q;
      if (!question || !question.trim()) {
        return Response.json({ error: 'सभी प्रश्नों को भरना अनिवार्य है।' }, { status: 400 });
      }

      let answerHash = null;
      if (!answer || !answer.trim()) {
        // Check if existing question matches, so we can reuse hash
        const matchingExisting = existingQs.find(eq => eq.question.trim().toLowerCase() === question.trim().toLowerCase());
        if (matchingExisting && matchingExisting.answer_hash) {
          answerHash = matchingExisting.answer_hash;
        } else {
          return Response.json({ error: 'सभी नए सुरक्षा प्रश्नों के उत्तर देना अनिवार्य है।' }, { status: 400 });
        }
      } else {
        // Clean the answer: lowercase and strip spaces
        const cleanAnswer = answer.trim().toLowerCase().replace(/\s+/g, '');

        // Generate PBKDF2 hash of clean answer
        answerHash = await hashPasswordPBKDF2(cleanAnswer);
      }

      processedQuestions.push({
        question: question.trim(),
        answer_hash: answerHash,
        is_custom: !!isCustom
      });
    }

    const questionsJson = JSON.stringify(processedQuestions);
    const cleanRecoveryEmail = recoveryEmail ? recoveryEmail.trim().toLowerCase() : null;

    await env.DB.prepare('UPDATE users SET security_questions = ?, recovery_email = ? WHERE id = ?')
      .bind(questionsJson, cleanRecoveryEmail, user.id)
      .run();

    return Response.json({ success: true, message: 'सुरक्षा प्रश्न और बैकअप ईमेल सफलतापूर्वक सहेज लिए गए हैं!' });

  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
