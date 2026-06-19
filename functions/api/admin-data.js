export async function onRequestGet(context) {
  const { request, env, data } = context;
  const user = data.user;
  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return new Response('Unauthorized', { status: 403 });
  }

  try {
    if (type === 'pending_ugc') {
      const results = await env.DB.prepare(
        `SELECT u.id, u.word_slug, u.meaning_text, users.name 
         FROM ugc_meanings u 
         JOIN users ON u.user_id = users.id 
         WHERE u.status = 'not_verified' 
         ORDER BY u.created_at DESC`
      ).all();
      return Response.json(results.results);
    } 
    else if (type === 'pending_links') {
      // Get comments that have reference_links with status 'pending'
      const comments = await env.DB.prepare(
        `SELECT c.id, c.comment_text, c.reference_links, u.name 
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.reference_links LIKE '%"status":"pending"%'
         ORDER BY c.created_at DESC`
      ).all();
      return Response.json(comments.results);
    }
    else if (type === 'deleted') {
      // Only owner should see revert bin (or maybe admins too, but let's restrict to owner for full safety as per plan)
      if (user.role !== 'owner') return new Response('Owner only', { status: 403 });

      // Get soft deleted UGC
      const ugc = await env.DB.prepare(
        `SELECT id, 'ugc' as source, meaning_text as text, action_by_id, action_at 
         FROM ugc_meanings 
         WHERE status = 'deleted' AND action_at > datetime('now', '-30 days')`
      ).all();

      // Get soft deleted Comments
      const comments = await env.DB.prepare(
        `SELECT id, 'comment' as source, comment_text as text, action_by_id, action_at 
         FROM comments 
         WHERE status = 'deleted' AND action_at > datetime('now', '-30 days')`
      ).all();

      const combined = [...ugc.results, ...comments.results].sort((a, b) => new Date(b.action_at) - new Date(a.action_at));
      
      return Response.json(combined);
    } 
    else if (type === 'deletion_requests') {
      const results = await env.DB.prepare(
        `SELECT id, email, name, delete_requested_at 
         FROM users 
         WHERE delete_requested_at IS NOT NULL 
         ORDER BY delete_requested_at DESC`
      ).all();
      return Response.json(results.results);
    }
    
    return new Response('Invalid type', { status: 400 });
  } catch (err) {
    return new Response('Server error', { status: 500 });
  }
}
