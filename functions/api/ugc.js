export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return Response.json({ error: 'slug required' }, { status: 400 });

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

  const meanings = await context.env.DB.prepare(
    `SELECT u.id, u.meaning_text, u.region, u.upvotes, u.downvotes, u.status, u.created_at, users.name, users.trust_score
     FROM ugc_meanings u
     JOIN users ON u.user_id = users.id
     WHERE u.word_slug = ? AND u.status != 'banned' AND u.status != 'deleted'
     ORDER BY u.upvotes DESC, u.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(slug, limit, offset).all();

  return Response.json(meanings.results);
}

export async function onRequestPost(context) {
  const user = context.data.user;
  if (!user) return Response.json({ error: 'Login required' }, { status: 401 });
  const body = await context.request.json();
  const { action, slug, meaning_text, region, meaning_id, vote_type } = body;

  if (action === 'add') {
    if (!meaning_text || meaning_text.trim() === '') {
      return Response.json({ error: 'Meaning text required' }, { status: 400 });
    }

    if (meaning_text.length > 1000) {
      return Response.json({ error: 'योगदान १००० अक्षरों से कम होना चाहिए।' }, { status: 400 });
    }

    if (region && region.length > 100) {
      return Response.json({ error: 'क्षेत्र १०० अक्षरों से कम होना चाहिए।' }, { status: 400 });
    }

    if (user.is_shadow_banned) {
      // Shadow ban logic: Return fake success without saving
      return Response.json({ success: true, message: 'Added successfully! Marked as Not Verified.' });
    }

    // Rate Limiting: 1 submission every 15 seconds
    const lastSubmission = await context.env.DB.prepare(
      'SELECT created_at FROM ugc_meanings WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(user.id).first();

    if (lastSubmission) {
      const lastTime = new Date(lastSubmission.created_at).getTime();
      const nowTime = Date.now();
      if (nowTime - lastTime < 15000) {
        return Response.json({ error: 'योगदान भेजने की गति बहुत तेज़ है। कृपया १५ सेकंड प्रतीक्षा करें।' }, { status: 429 });
      }
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
      const meaningAuthor = await context.env.DB.prepare('SELECT user_id, upvotes, downvotes FROM ugc_meanings WHERE id = ?').bind(meaning_id).first();
      
      if (!meaningAuthor) {
         return Response.json({ error: 'Meaning not found' }, { status: 404 });
      }
      
      if (meaningAuthor.user_id === user.id) {
         return Response.json({ error: 'You cannot vote on your own submission' }, { status: 400 });
      }

      if (user.is_shadow_banned) {
        // Shadow ban disguise: pretend vote succeeded
        let fakeUp = meaningAuthor.upvotes;
        let fakeDown = meaningAuthor.downvotes;
        if (vote_type === 'up') fakeUp++;
        if (vote_type === 'down') fakeDown++;
        return Response.json({ success: true, upvotes: fakeUp, downvotes: fakeDown });
      }

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

      // 4. Auto-flag check (Spam protection)
      // If a meaning gets 5 downvotes and has less than 2 upvotes, flag the meaning for admin review
      if (down.c >= 5 && up.c < 2) {
        await context.env.DB.prepare('UPDATE ugc_meanings SET status = "flagged" WHERE id = ?').bind(meaning_id).run();
      }

      return Response.json({ success: true, upvotes: up.c, downvotes: down.c });
    } catch (e) {
      return Response.json({ error: 'Database error' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
