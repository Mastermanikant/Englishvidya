export async function onRequestGet(context) {
  const user = context.data.user;

  // Authorization check: only admin or owner allowed
  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return new Response('Unauthorized', { status: 403 });
  }

  try {
    // 1. Get test summary analytics (aggregating avg, max, min scores)
    const summary = await context.env.DB.prepare(`
      SELECT 
        lesson_slug, 
        COUNT(*) as total_attempts, 
        AVG(CAST(score AS REAL) / total_questions) * 100 as avg_percent,
        MAX(score) as max_score,
        MIN(score) as min_score,
        AVG(score) as avg_score,
        MAX(total_questions) as total_questions
      FROM test_attempts
      GROUP BY lesson_slug
    `).all();

    // 2. Get detailed list of all student attempts
    const attempts = await context.env.DB.prepare(`
      SELECT 
        t.id, 
        t.lesson_slug, 
        t.score, 
        t.total_questions, 
        t.created_at, 
        u.name, 
        u.email 
      FROM test_attempts t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC
      LIMIT 1000
    `).all();

    return Response.json({
      summary: summary.results,
      attempts: attempts.results
    });
  } catch (err) {
    return new Response('Database error', { status: 500 });
  }
}
