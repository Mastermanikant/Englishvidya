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

    const processedQuestions = [];
    for (const q of questions) {
      const { question, answer, isCustom } = q;
      if (!question || !question.trim() || !answer || !answer.trim()) {
        return Response.json({ error: 'सभी प्रश्नों और उत्तरों को भरना अनिवार्य है।' }, { status: 400 });
      }

      // Clean the answer: lowercase and strip spaces
      const cleanAnswer = answer.trim().toLowerCase().replace(/\s+/g, '');

      // Generate SHA-256 hash of clean answer
      const encoder = new TextEncoder();
      const data = encoder.encode(cleanAnswer);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const answerHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

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
