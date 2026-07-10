export async function onRequestGet(context) {
  const { request, env, data } = context;
  const user = data.user;
  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return new Response('Unauthorized', { status: 403 });
  }

  try {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

    if (type === 'pending_ugc') {
      const results = await env.DB.prepare(
        `SELECT u.id, u.word_slug, u.meaning_text, users.name 
         FROM ugc_meanings u 
         JOIN users ON u.user_id = users.id 
         WHERE u.status = 'not_verified' 
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`
      ).bind(limit, offset).all();
      return Response.json(results.results);
    } 
    else if (type === 'pending_links') {
      // Get comments that have reference_links with status 'pending'
      const comments = await env.DB.prepare(
        `SELECT c.id, c.comment_text, c.reference_links, u.name 
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.reference_links LIKE '%"status":"pending"%'
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`
      ).bind(limit, offset).all();
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
      
      return Response.json(combined.slice(offset, offset + limit));
    } 
    else if (type === 'deletion_requests') {
      const results = await env.DB.prepare(
        `SELECT id, email, name, delete_requested_at 
         FROM users 
         WHERE delete_requested_at IS NOT NULL 
         ORDER BY delete_requested_at DESC
         LIMIT ? OFFSET ?`
      ).bind(limit, offset).all();
      return Response.json(results.results);
    }
    else if (type === 'users') {
      const results = await env.DB.prepare(
        `SELECT id, name, email, username, role, trust_score, is_shadow_banned, admin_reset_requested_at, created_at 
         FROM users 
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      ).bind(limit, offset).all();
      return Response.json(results.results);
    }
    else if (type === 'tickets') {
      let query = `
        SELECT t.id, t.title, t.message, t.type, t.status, t.created_at, u.name, u.email 
        FROM support_tickets t 
        JOIN users u ON t.user_id = u.id
      `;
      if (user.role === 'admin') {
        query += ` WHERE t.type = 'admin'`;
      }
      query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
      const results = await env.DB.prepare(query).bind(limit, offset).all();
      return Response.json(results.results);
    }
    else if (type === 'ticket_replies') {
      const ticketId = url.searchParams.get('ticket_id');
      if (!ticketId) {
        return new Response('Missing ticket_id', { status: 400 });
      }
      const results = await env.DB.prepare(
        `SELECT r.id, r.reply_text, r.created_at, u.name, u.role, u.avatar_url 
         FROM support_replies r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.ticket_id = ? 
         ORDER BY r.created_at ASC
         LIMIT ? OFFSET ?`
      ).bind(ticketId, limit, offset).all();
      return Response.json(results.results);
    }
    
    return new Response('Invalid type', { status: 400 });
  } catch (err) {
    return new Response('Server error', { status: 500 });
  }
}
