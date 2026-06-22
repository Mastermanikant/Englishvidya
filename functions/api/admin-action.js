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
    else if (action === 'approve_delete') statusToSet = 'anonymized';
    else return new Response('Invalid action', { status: 400 });

    const now = new Date().toISOString();

    if (type === 'ugc') {
      await env.DB.prepare(
        'UPDATE ugc_meanings SET status = ?, action_by_id = ?, action_at = ? WHERE id = ?'
      ).bind(statusToSet, user.id, now, id).run();
    } else if (type === 'link') {
      const comment = await env.DB.prepare('SELECT reference_links FROM comments WHERE id = ?').bind(id).first();
      if (comment) {
        let refs = JSON.parse(comment.reference_links || '[]');
        // We approve or reject ALL pending links for this comment id. 
        // Or we could pass a specific url, but let's do all pending for simplicity.
        refs = refs.map(r => {
          if (r.status === 'pending') {
            return { ...r, status: action === 'approve' ? 'approved' : 'rejected' };
          }
          return r;
        });
        await env.DB.prepare(
          'UPDATE comments SET reference_links = ? WHERE id = ?'
        ).bind(JSON.stringify(refs), id).run();
      }
    } else if (type === 'comment') {
      // Comments don't really have 'approve' by default unless moderated. 
      // But we can 'reject' (soft delete) them.
      await env.DB.prepare(
        'UPDATE comments SET status = ?, action_by_id = ?, action_at = ? WHERE id = ?'
      ).bind(statusToSet, user.id, now, id).run();
    } else if (type === 'user' && action === 'approve_delete') {
      // Soft Delete: Anonymize user data
      await env.DB.prepare(`
        UPDATE users 
        SET 
          name = 'Deleted User',
          username = NULL,
          email = 'deleted_' || id || '_' || hex(randomblob(4)) || '@deleted.englishvidya.com',
          google_id = 'deleted_' || id || '_' || hex(randomblob(4)),
          avatar_url = '',
          social_facebook = '',
          social_youtube = '',
          social_instagram = '',
          social_twitter = '',
          social_linkedin = '',
          social_pinterest = '',
          social_website1 = '',
          social_website2 = '',
          delete_requested_at = 'anonymized'
        WHERE id = ?
      `).bind(id).run();
      return Response.json({ success: true, newStatus: 'anonymized' });
    } else if (type === 'user_trust') {
      const { trust_score } = body;
      if (trust_score === undefined) {
        return new Response('Missing trust_score', { status: 400 });
      }
      await env.DB.prepare('UPDATE users SET trust_score = ? WHERE id = ?').bind(trust_score, id).run();
      return Response.json({ success: true, newStatus: trust_score });
    } else if (type === 'user_shadow_ban') {
      const { is_shadow_banned } = body;
      if (is_shadow_banned === undefined) {
        return new Response('Missing is_shadow_banned', { status: 400 });
      }
      await env.DB.prepare('UPDATE users SET is_shadow_banned = ? WHERE id = ?').bind(is_shadow_banned, id).run();
      return Response.json({ success: true, newStatus: is_shadow_banned });
    } else if (type === 'ticket_status') {
      const { status } = body;
      if (status === undefined) {
        return new Response('Missing status', { status: 400 });
      }
      await env.DB.prepare('UPDATE support_tickets SET status = ?, updated_at = datetime("now") WHERE id = ?').bind(status, id).run();
      return Response.json({ success: true, newStatus: status });
    } else if (type === 'admin_reset_user_password') {
      const { newPassword } = body;
      if (!newPassword || newPassword.length < 6) {
        return Response.json({ success: false, error: 'पासवर्ड कम से कम ६ अक्षरों का होना चाहिए।' }, { status: 400 });
      }

      // Fetch user's admin reset requested at
      const targetUser = await env.DB.prepare('SELECT admin_reset_requested_at FROM users WHERE id = ?').bind(id).first();
      if (!targetUser) {
        return Response.json({ success: false, error: 'यूज़र नहीं मिला।' }, { status: 404 });
      }

      if (!targetUser.admin_reset_requested_at) {
        return Response.json({ success: false, error: 'इस यूज़र के लिए कोई एडमिन रीसेट अनुरोध नहीं मिला है।' }, { status: 400 });
      }

      // Check if 48 hours have passed
      const reqTime = new Date(targetUser.admin_reset_requested_at).getTime();
      const now = Date.now();
      const diffHours = (now - reqTime) / (1000 * 60 * 60);

      if (diffHours < 48) {
        const remaining = Math.ceil(48 - diffHours);
        return Response.json({ success: false, error: `सुरक्षा कारणों से होल्ड सक्रिय है। कृपया ${remaining} घंटे बाद प्रयास करें।` }, { status: 400 });
      }

      // Hash password using PBKDF2
      const password_hash = await hashPasswordPBKDF2(newPassword);

      // Update password and clear reset state
      await env.DB.prepare(
        `UPDATE users 
         SET password_hash = ?, 
             admin_reset_requested_at = NULL, 
             reset_token = NULL, 
             reset_token_expires_at = NULL, 
             reset_attempts = 0 
         WHERE id = ?`
      )
        .bind(password_hash, id)
        .run();

      return Response.json({ success: true, message: 'पासवर्ड सफलतापूर्वक बदल दिया गया है!' });
    } else {
      return new Response('Invalid type', { status: 400 });
    }

    return Response.json({ success: true, newStatus: statusToSet });
  } catch (err) {
    return new Response('Server Error: ' + err.message, { status: 500 });
  }
}

async function hashPasswordPBKDF2(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    512
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}
