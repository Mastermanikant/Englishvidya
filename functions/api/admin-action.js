export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return new Response('Unauthorized', { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, id, action } = body; 
    // type: 'ugc' or 'comment'
    // id: item id
    // action: 'approve' or 'reject' (soft delete)

    if (!type || !id || !action) {
      return new Response('Invalid payload', { status: 400 });
    }

    let statusToSet = '';
    if (action === 'approve') statusToSet = 'approved';
    else if (action === 'reject') statusToSet = 'deleted';
    else return new Response('Invalid action', { status: 400 });

    const now = new Date().toISOString();

    if (type === 'ugc') {
      await env.DB.prepare(
        'UPDATE ugc_meanings SET status = ?, action_by_id = ?, action_at = ? WHERE id = ?'
      ).bind(statusToSet, user.id, now, id).run();
    } else if (type === 'comment') {
      // Comments don't really have 'approve' by default unless moderated. 
      // But we can 'reject' (soft delete) them.
      await env.DB.prepare(
        'UPDATE comments SET status = ?, action_by_id = ?, action_at = ? WHERE id = ?'
      ).bind(statusToSet, user.id, now, id).run();
    } else {
      return new Response('Invalid type', { status: 400 });
    }

    return Response.json({ success: true, newStatus: statusToSet });
  } catch (err) {
    return new Response('Server Error', { status: 500 });
  }
}
