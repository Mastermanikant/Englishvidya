export async function onRequestPut(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate inputs (basic)
    const name = (body.name || '').trim().substring(0, 50);
    const username = (body.username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 30);
    
    const social_facebook = (body.social_facebook || '').trim().substring(0, 200);
    const social_youtube = (body.social_youtube || '').trim().substring(0, 200);
    const social_instagram = (body.social_instagram || '').trim().substring(0, 200);
    const social_twitter = (body.social_twitter || '').trim().substring(0, 200);
    const social_linkedin = (body.social_linkedin || '').trim().substring(0, 200);
    const social_pinterest = (body.social_pinterest || '').trim().substring(0, 200);
    const social_website1 = (body.social_website1 || '').trim().substring(0, 200);
    const social_website2 = (body.social_website2 || '').trim().substring(0, 200);

    let location_address = null;
    if (body.location_address) {
      if (typeof body.location_address === 'object') {
        location_address = JSON.stringify(body.location_address);
      } else if (typeof body.location_address === 'string') {
        location_address = body.location_address;
      }
    }

    if (!name) {
      return new Response('Name is required', { status: 400 });
    }

    // Check if username is taken by another user
    if (username) {
      const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ? AND id != ?').bind(username, user.id).first();
      if (existing) {
        return new Response('Username is already taken', { status: 400 });
      }
    }

    await env.DB.prepare(`
      UPDATE users SET 
        name = ?, 
        username = ?,
        social_facebook = ?,
        social_youtube = ?,
        social_instagram = ?,
        social_twitter = ?,
        social_linkedin = ?,
        social_pinterest = ?,
        social_website1 = ?,
        social_website2 = ?,
        location_address = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      name, username || null, 
      social_facebook, social_youtube, social_instagram, 
      social_twitter, social_linkedin, social_pinterest, 
      social_website1, social_website2, 
      location_address,
      user.id
    ).run();

    return Response.json({ success: true, message: 'Profile updated successfully' });
  } catch (e) {
    return new Response('Something went wrong. Please try again later.', { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    
    if (body.action === 'request_delete') {
      await env.DB.prepare(`UPDATE users SET delete_requested_at = datetime('now') WHERE id = ?`).bind(user.id).run();
      return Response.json({ success: true, message: 'Account deletion requested successfully' });
    } else if (body.action === 'cancel_delete') {
      await env.DB.prepare(`UPDATE users SET delete_requested_at = NULL WHERE id = ?`).bind(user.id).run();
      return Response.json({ success: true, message: 'Account deletion request cancelled' });
    } else if (body.action === 'accept_rules') {
      await env.DB.prepare(`UPDATE users SET has_accepted_rules = 1 WHERE id = ?`).bind(user.id).run();
      return Response.json({ success: true, message: 'Rules accepted' });
    }

    return new Response('Invalid action', { status: 400 });
  } catch (e) {
    return new Response('Something went wrong. Please try again later.', { status: 500 });
  }
}
