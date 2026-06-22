export async function onRequestGet(context) {
  const user = context.data.user;
  if (!user) {
    return Response.json([], { status: 200 }); // return empty array if not logged in
  }

  try {
    const attempts = await context.env.DB.prepare(
      'SELECT id, lesson_slug, score, total_questions, answers_json, created_at FROM test_attempts WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(user.id).all();

    return Response.json(attempts.results);
  } catch (err) {
    return new Response('Database error', { status: 500 });
  }
}

export async function onRequestPost(context) {
  const user = context.data.user;
  if (!user) {
    return Response.json({ error: 'Login required' }, { status: 401 });
  }

  try {
    const { lesson_slug, score, total_questions, answers_json } = await context.request.json();

    if (!lesson_slug || score === undefined || total_questions === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await context.env.DB.prepare(
      'INSERT INTO test_attempts (user_id, lesson_slug, score, total_questions, answers_json) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      user.id,
      lesson_slug,
      score,
      total_questions,
      answers_json || '[]'
    ).run();

    return Response.json({ success: true });
  } catch (err) {
    return new Response('Database error', { status: 500 });
  }
}
