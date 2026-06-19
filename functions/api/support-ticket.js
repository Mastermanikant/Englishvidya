export async function onRequestGet(context) {
  const { request, env, data } = context;
  const user = data.user;
  const url = new URL(request.url);

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const ticketId = url.searchParams.get('ticket_id');

  try {
    if (ticketId) {
      // Get single ticket details
      const ticket = await env.DB.prepare(
        `SELECT t.id, t.user_id, t.title, t.message, t.type, t.status, t.created_at 
         FROM support_tickets t 
         WHERE t.id = ?`
      ).bind(ticketId).first();

      if (!ticket) {
        return new Response('Ticket not found', { status: 404 });
      }

      // Authorization: Admin/Owner can see any ticket, users can only see their own tickets
      const isAuthorized = user.role === 'admin' || user.role === 'owner' || ticket.user_id === user.id;
      if (!isAuthorized) {
        return new Response('Unauthorized', { status: 403 });
      }

      // Get replies
      const replies = await env.DB.prepare(
        `SELECT r.id, r.reply_text, r.created_at, u.name, u.role, u.avatar_url 
         FROM support_replies r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.ticket_id = ? 
         ORDER BY r.created_at ASC`
      ).bind(ticketId).all();

      return Response.json({ ticket, replies: replies.results });
    } else {
      // Get all tickets of the logged-in user
      const tickets = await env.DB.prepare(
        `SELECT id, title, message, type, status, created_at, updated_at 
         FROM support_tickets 
         WHERE user_id = ? 
         ORDER BY updated_at DESC`
      ).bind(user.id).all();

      return Response.json(tickets.results);
    }
  } catch (err) {
    return new Response('Database error: ' + err.message, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { title, message, type } = await request.json();

    if (!title || !message || !type) {
      return new Response('Missing required fields', { status: 400 });
    }

    if (type !== 'admin' && type !== 'owner') {
      return new Response('Invalid type (must be admin or owner)', { status: 400 });
    }

    const now = new Date().toISOString();
    const result = await env.DB.prepare(
      `INSERT INTO support_tickets (user_id, title, message, type, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 'open', ?, ?)`
    ).bind(user.id, title, message, type, now, now).run();

    return Response.json({ success: true, ticketId: result.meta.last_row_id || result.insertId });
  } catch (err) {
    return new Response('Database error: ' + err.message, { status: 500 });
  }
}
