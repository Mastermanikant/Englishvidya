export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return Response.json({ error: 'slug required' }, { status: 400 });

  const comments = await context.env.DB.prepare(
    `SELECT c.id, c.comment_text, c.created_at, u.name, u.avatar_url, u.trust_score
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.page_slug = ? AND u.is_shadow_banned = 0
     ORDER BY c.created_at DESC`
  ).bind(slug).all();

  return Response.json(comments.results);
}

export async function onRequestPost(context) {
  const user = context.data.user;
  if (!user) return Response.json({ error: 'Login required to comment' }, { status: 401 });
  if (user.is_shadow_banned) {
    // Shadow ban logic: Return success, but don't actually insert
    return Response.json({ success: true, message: 'Comment posted!' });
  }

  const body = await context.request.json();
  const { slug, text } = body;

  if (!slug || !text || text.trim() === '') {
    return Response.json({ error: 'Comment text required' }, { status: 400 });
  }

  await context.env.DB.prepare(
    'INSERT INTO comments (page_slug, user_id, comment_text) VALUES (?, ?, ?)'
  ).bind(slug, user.id, text.trim()).run();

  return Response.json({ success: true, message: 'Comment posted!' });
}
