export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;
  
  const result = await db.prepare('SELECT id, user_id, action, target_id, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
  return Response.json({ success: true, logs: result.results });
}
