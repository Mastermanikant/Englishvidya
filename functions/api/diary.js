export async function onRequestGet(context) {
  const user = context.data.user;
  if (!user) return Response.json({ error: 'Login required' }, { status: 401 });

  const notes = await context.env.DB.prepare(
    'SELECT word_slug, note_content, updated_at FROM user_notes WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(user.id).all();

  const bookmarks = await context.env.DB.prepare(
    'SELECT word_slug, word_text, meaning_text, pron_text, category, created_at FROM user_bookmarks WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return Response.json({ notes: notes.results, bookmarks: bookmarks.results });
}

export async function onRequestPost(context) {
  const user = context.data.user;
  if (!user) return Response.json({ error: 'Login required' }, { status: 401 });

  // --- SYNC LIMIT CHECK ---
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);

  // Reset daily count agar naya din hai
  if (user.last_sync_date !== today) {
    await context.env.DB.prepare(
      'UPDATE users SET daily_sync_count = 0, last_sync_date = ? WHERE id = ?'
    ).bind(today, user.id).run();
    user.daily_sync_count = 0;
  }

  // Reset monthly count agar naya month hai
  if (user.last_sync_month !== thisMonth) {
    await context.env.DB.prepare(
      'UPDATE users SET monthly_sync_count = 0, last_sync_month = ? WHERE id = ?'
    ).bind(thisMonth, user.id).run();
    user.monthly_sync_count = 0;
  }

  const body = await context.request.json();
  const items = body.items || [];

  // Limit check: 500/day, 10000/month
  if (user.daily_sync_count + items.length > 500) {
    return Response.json({ error: 'Daily sync limit (500) reached. Try tomorrow.' }, { status: 429 });
  }
  if (user.monthly_sync_count + items.length > 10000) {
    return Response.json({ error: 'Monthly sync limit (10,000) reached.' }, { status: 429 });
  }

  // --- BATCH UPSERT ---
  for (const item of items) {
    if (item.type === 'note') {
      await context.env.DB.prepare(
        `INSERT INTO user_notes (user_id, word_slug, note_content, updated_at) 
         VALUES (?, ?, ?, datetime('now')) 
         ON CONFLICT(user_id, word_slug) DO UPDATE SET note_content = ?, updated_at = datetime('now')`
      ).bind(user.id, item.word_slug, item.note_content, item.note_content).run();
    } else if (item.type === 'bookmark') {
      await context.env.DB.prepare(
        `INSERT INTO user_bookmarks (user_id, word_slug, word_text, meaning_text, pron_text, category) 
         VALUES (?, ?, ?, ?, ?, ?) 
         ON CONFLICT(user_id, word_slug) DO NOTHING`
      ).bind(user.id, item.word_slug, item.word_text || '', item.meaning_text || '', item.pron_text || '', item.category || '').run();
    } else if (item.type === 'remove_bookmark') {
      await context.env.DB.prepare(
        'DELETE FROM user_bookmarks WHERE user_id = ? AND word_slug = ?'
      ).bind(user.id, item.word_slug).run();
    }
  }

  // Update sync counts
  await context.env.DB.prepare(
    'UPDATE users SET daily_sync_count = daily_sync_count + ?, monthly_sync_count = monthly_sync_count + ? WHERE id = ?'
  ).bind(items.length, items.length, user.id).run();

  return Response.json({ success: true, synced: items.length });
}
