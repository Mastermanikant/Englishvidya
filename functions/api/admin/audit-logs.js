export async function onRequestGet(context) {
  try {
    const { env } = context;
    if (!env.DB || typeof env.DB.prepare !== 'function') {
      return Response.json({ success: true, logs: [] });
    }
    const result = await env.DB.prepare(
      'SELECT id, user_id, action, target_id, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 100'
    ).all().catch(() => ({ results: [] }));
    return Response.json({ success: true, logs: result?.results || [] });
  } catch (err) {
    return Response.json({ success: false, error: err.message || 'Audit logs error', logs: [] }, { status: 500 });
  }
}
