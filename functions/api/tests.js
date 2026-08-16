export async function onRequestGet(context) {
  try {
    const user = context.data?.user;
    if (!user) {
      return Response.json([], { status: 200 });
    }

    const { env } = context;
    if (!env.DB || typeof env.DB.prepare !== 'function') {
      return Response.json([], { status: 200 });
    }

    const attempts = await env.DB.prepare(
      'SELECT id, lesson_slug, score, total_questions, answers_json, created_at FROM test_attempts WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(user.id || 1).all();

    return Response.json(attempts?.results || [], { status: 200 });
  } catch (err) {
    console.warn('Test attempts fetch warning:', err);
    return Response.json([], { status: 200 });
  }
}

export async function onRequestPost(context) {
  try {
    const user = context.data?.user;
    if (!user) {
      return Response.json({ success: false, error: 'Login required' }, { status: 401 });
    }

    const body = await context.request.json().catch(() => ({}));
    const { lesson_slug, score, total_questions, answers_json } = body;

    if (!lesson_slug || score === undefined || total_questions === undefined) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { env } = context;
    if (!env.DB || typeof env.DB.prepare !== 'function') {
      return Response.json({ success: true, saved_locally: true });
    }

    await env.DB.prepare(
      'INSERT INTO test_attempts (user_id, lesson_slug, score, total_questions, answers_json) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      user.id || 1,
      lesson_slug,
      score,
      total_questions,
      answers_json || '[]'
    ).run();

    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Test attempt POST error:', err);
    return Response.json({ success: false, error: err.message || 'Database error' }, { status: 500 });
  }
}
