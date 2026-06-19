export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return Response.json({ error: 'slug required' }, { status: 400 });

  const meanings = await context.env.DB.prepare(
    `SELECT u.id, u.meaning_text, u.region, u.upvotes, u.downvotes, u.status, u.created_at, users.name, users.trust_score
     FROM ugc_meanings u
     JOIN users ON u.user_id = users.id
     WHERE u.word_slug = ? AND u.status != 'banned'
     ORDER BY u.upvotes DESC, u.created_at DESC`
  ).bind(slug).all();

  return Response.json(meanings.results);
}

export async function onRequestPost(context) {
  const user = context.data.user;
  if (!user) return Response.json({ error: 'Login required' }, { status: 401 });
  if (user.is_shadow_banned) {
    // Shadow ban logic: Return success, but don't insert it (or insert as banned)
    return Response.json({ success: true, message: 'Meaning submitted for review.' });
  }

  const body = await context.request.json();
  const { action, slug, meaning_text, region, meaning_id, vote_type } = body;

  if (action === 'add') {
    if (!meaning_text || meaning_text.trim() === '') {
      return Response.json({ error: 'Meaning text required' }, { status: 400 });
    }

    await context.env.DB.prepare(
      `INSERT INTO ugc_meanings (word_slug, user_id, meaning_text, region, status) 
       VALUES (?, ?, ?, ?, 'not_verified')`
    ).bind(slug, user.id, meaning_text.trim(), region || '').run();

    return Response.json({ success: true, message: 'Added successfully! Marked as Not Verified.' });
  } 
  
  else if (action === 'vote') {
    if (!meaning_id || !vote_type) return Response.json({ error: 'Invalid vote' }, { status: 400 });

    try {
      // 1. Insert/Update vote
      await context.env.DB.prepare(
        `INSERT INTO votes (user_id, meaning_id, vote_type) VALUES (?, ?, ?)
         ON CONFLICT(user_id, meaning_id) DO UPDATE SET vote_type = ?`
      ).bind(user.id, meaning_id, vote_type, vote_type).run();

      // 2. Recalculate upvotes/downvotes
      const up = await context.env.DB.prepare('SELECT COUNT(*) as c FROM votes WHERE meaning_id = ? AND vote_type = "up"').bind(meaning_id).first();
      const down = await context.env.DB.prepare('SELECT COUNT(*) as c FROM votes WHERE meaning_id = ? AND vote_type = "down"').bind(meaning_id).first();

      // 3. Update UGC table
      await context.env.DB.prepare(
        'UPDATE ugc_meanings SET upvotes = ?, downvotes = ? WHERE id = ?'
      ).bind(up.c, down.c, meaning_id).run();

      // 4. Auto-ban check (Spam protection)
      // If a meaning gets 5 downvotes and has less than 2 upvotes, shadow ban the user who created it
      if (down.c >= 5 && up.c < 2) {
        const ugc = await context.env.DB.prepare('SELECT user_id FROM ugc_meanings WHERE id = ?').bind(meaning_id).first();
        if (ugc) {
          await context.env.DB.prepare('UPDATE users SET is_shadow_banned = 1 WHERE id = ?').bind(ugc.user_id).run();
          await context.env.DB.prepare('UPDATE ugc_meanings SET status = "banned" WHERE id = ?').bind(meaning_id).run();
        }
      }

      return Response.json({ success: true, upvotes: up.c, downvotes: down.c });
    } catch (e) {
      return Response.json({ error: 'Database error' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
