export async function onRequestGet(context) {
  const user = context.data.user;
  if (!user) return Response.json({ error: 'Login required' }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);

  let dailyCount = user.daily_sync_count;
  let monthlyCount = user.monthly_sync_count;

  // Reset daily count if date changed
  if (user.last_sync_date !== today) {
    await context.env.DB.prepare(
      'UPDATE users SET daily_sync_count = 0, last_sync_date = ? WHERE id = ?'
    ).bind(today, user.id).run();
    dailyCount = 0;
  }

  // Reset monthly count if month changed
  if (user.last_sync_month !== thisMonth) {
    await context.env.DB.prepare(
      'UPDATE users SET monthly_sync_count = 0, last_sync_month = ? WHERE id = ?'
    ).bind(thisMonth, user.id).run();
    monthlyCount = 0;
  }

  const url = new URL(context.request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

  const notes = await context.env.DB.prepare(
    'SELECT word_slug, note_content, updated_at FROM user_notes WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
  ).bind(user.id, limit, offset).all();

  const bookmarks = await context.env.DB.prepare(
    'SELECT word_slug, word_text, meaning_text, pron_text, category, created_at FROM user_bookmarks WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(user.id, limit, offset).all();

  return Response.json({ 
    notes: notes.results, 
    bookmarks: bookmarks.results,
    daily_sync_count: dailyCount,
    monthly_sync_count: monthlyCount
  });
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

  // Limit check: 15/day, 150/month (Hardcoded to prevent abuse and keep server cost low)
  if (user.daily_sync_count + items.length > 15) {
    return Response.json({ error: 'Daily sync limit (15) reached. (दैनिक सीमा 15 समाप्त)' }, { status: 429 });
  }
  if (user.monthly_sync_count + items.length > 150) {
    return Response.json({ error: 'Monthly sync limit (150) reached. (मासिक सीमा 150 समाप्त)' }, { status: 429 });
  }

  // --- BATCH UPSERT ---
  for (const item of items) {
    if (item.word_slug && item.word_slug.length > 100) {
      return Response.json({ error: 'Word slug exceeds 100 characters limit' }, { status: 400 });
    }
    if (item.type === 'note') {
      if (item.note_content && item.note_content.length > 5000) {
        return Response.json({ error: 'Note content exceeds 5000 characters limit' }, { status: 400 });
      }
      await context.env.DB.prepare(
        `INSERT INTO user_notes (user_id, word_slug, note_content, updated_at) 
         VALUES (?, ?, ?, datetime('now')) 
         ON CONFLICT(user_id, word_slug) DO UPDATE SET note_content = ?, updated_at = datetime('now')`
      ).bind(user.id, item.word_slug, item.note_content, item.note_content).run();
    } else if (item.type === 'bookmark') {
      if ((item.word_text && item.word_text.length > 100) ||
          (item.meaning_text && item.meaning_text.length > 500) ||
          (item.pron_text && item.pron_text.length > 100) ||
          (item.category && item.category.length > 50)) {
        return Response.json({ error: 'Bookmark data exceeds length limit' }, { status: 400 });
      }
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
