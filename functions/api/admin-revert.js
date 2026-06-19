export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (!user || user.role !== 'owner') {
    return new Response('Unauthorized - Owner Only', { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, id } = body; 
    // type: 'ugc' or 'comment'
    // action is implicitly 'revert'

    if (!type || !id) {
      return new Response('Invalid payload', { status: 400 });
    }

    if (type === 'ugc') {
      await env.DB.prepare(
        'UPDATE ugc_meanings SET status = ?, action_by_id = NULL, action_at = NULL WHERE id = ?'
      ).bind('approved', id).run();
    } else if (type === 'comment') {
      await env.DB.prepare(
        'UPDATE comments SET status = ?, action_by_id = NULL, action_at = NULL WHERE id = ?'
      ).bind('active', id).run();
    } else {
      return new Response('Invalid type', { status: 400 });
    }

    return Response.json({ success: true, reverted: true });
  } catch (err) {
    return new Response('Server Error', { status: 500 });
  }
}
