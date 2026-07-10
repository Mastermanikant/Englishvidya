export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { ticket_id, reply_text } = await request.json();

    if (!ticket_id || !reply_text) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Fetch the ticket to check authorization
    const ticket = await env.DB.prepare(
      'SELECT user_id, type, status FROM support_tickets WHERE id = ?'
    ).bind(ticket_id).first();

    if (!ticket) {
      return new Response('Ticket not found', { status: 404 });
    }

    // Authorization check
    let isAuthorized = false;
    if (user.role === 'owner') {
      isAuthorized = true; // Owner can access/reply to everything
    } else if (user.role === 'admin') {
      isAuthorized = ticket.type === 'admin'; // Admin can only reply to admin-type tickets
    } else {
      isAuthorized = ticket.user_id === user.id; // Users can only reply to their own tickets
    }

    if (!isAuthorized) {
      return new Response('Unauthorized', { status: 403 });
    }

    const now = new Date().toISOString();
    
    // Insert the reply
    await env.DB.prepare(
      'INSERT INTO support_replies (ticket_id, user_id, reply_text, created_at) VALUES (?, ?, ?, ?)'
    ).bind(ticket_id, user.id, reply_text, now).run();

    // Update the ticket updated_at time, and reset status to 'open' if user replies
    let newStatus = ticket.status;
    if (user.role !== 'admin' && user.role !== 'owner' && ticket.status === 'resolved') {
      newStatus = 'open'; // Reopen ticket if user posts a reply on a resolved ticket
    }

    await env.DB.prepare(
      'UPDATE support_tickets SET updated_at = ?, status = ? WHERE id = ?'
    ).bind(now, newStatus, ticket_id).run();

    return Response.json({ success: true });
  } catch (err) {
    return new Response('Something went wrong. Please try again later.', { status: 500 });
  }
}
