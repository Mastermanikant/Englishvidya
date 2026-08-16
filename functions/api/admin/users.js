export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;
  
  const result = await db.prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC LIMIT 100').all();
  return Response.json({ success: true, users: result.results });
}
