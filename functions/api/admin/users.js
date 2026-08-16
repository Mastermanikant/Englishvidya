export async function onRequestGet(context) {
  try {
    const { env } = context;
    if (!env.DB || typeof env.DB.prepare !== 'function') {
      return Response.json({ success: true, users: [] });
    }
    const result = await env.DB.prepare(
      'SELECT id, google_id, email, name, avatar_url, role, trust_score, created_at FROM users ORDER BY created_at DESC LIMIT 100'
    ).all().catch(() => ({ results: [] }));
    return Response.json({ success: true, users: result?.results || [] });
  } catch (err) {
    return Response.json({ success: false, error: err.message || 'Users fetch error', users: [] }, { status: 500 });
  }
}
