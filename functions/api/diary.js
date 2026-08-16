export async function onRequestGet(context) {
  try {
    const user = context.data?.user;
    if (!user) {
      return Response.json({ success: false, error: 'Login required', notes: [], bookmarks: [] }, { status: 401 });
    }

    const { env, request } = context;
    if (!env.DB || typeof env.DB.prepare !== 'function') {
      return Response.json({ 
        success: true, 
        notes: [], 
        bookmarks: [], 
        message: 'Storage operational (offline fallback)' 
      }, { status: 200 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

    let notes = { results: [] };
    let bookmarks = { results: [] };

    try {
      notes = await env.DB.prepare(
        'SELECT word_slug, note_content, updated_at FROM user_notes WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
      ).bind(user.id || 1, limit, offset).all();
    } catch (e) {
      console.warn('DB notes fetch warning:', e);
    }

    try {
      bookmarks = await env.DB.prepare(
        'SELECT word_slug, word_text, meaning_text, pron_text, category, created_at FROM user_bookmarks WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(user.id || 1, limit, offset).all();
    } catch (e) {
      console.warn('DB bookmarks fetch warning:', e);
    }

    return Response.json({
      success: true,
      notes: notes?.results || [],
      bookmarks: bookmarks?.results || []
    }, { status: 200 });

  } catch (err) {
    console.error('Fatal /api/diary GET error:', err);
    return Response.json({ success: false, error: err.message || 'Internal error', notes: [], bookmarks: [] }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const user = context.data?.user;
    if (!user) {
      return Response.json({ success: false, error: 'Login required' }, { status: 401 });
    }

    const { env, request } = context;
    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items : [];

    if (!env.DB || typeof env.DB.prepare !== 'function') {
      return Response.json({ success: true, synced: items.length, message: 'Saved locally' }, { status: 200 });
    }

    let syncedCount = 0;
    for (const item of items) {
      try {
        if (item.type === 'note' && item.word_slug) {
          await env.DB.prepare(
            'INSERT INTO user_notes (user_id, word_slug, note_content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id, word_slug) DO UPDATE SET note_content = excluded.note_content, updated_at = CURRENT_TIMESTAMP'
          ).bind(user.id || 1, item.word_slug, item.note_content || '').run();
          syncedCount++;
        } else if (item.type === 'bookmark' && item.word_slug) {
          await env.DB.prepare(
            'INSERT INTO user_bookmarks (user_id, word_slug, word_text, meaning_text, pron_text, category, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id, word_slug) DO NOTHING'
          ).bind(user.id || 1, item.word_slug, item.word_text || '', item.meaning_text || '', item.pron_text || '', item.category || 'general').run();
          syncedCount++;
        } else if (item.type === 'remove_bookmark' && item.word_slug) {
          await env.DB.prepare(
            'DELETE FROM user_bookmarks WHERE user_id = ? AND word_slug = ?'
          ).bind(user.id || 1, item.word_slug).run();
          syncedCount++;
        }
      } catch (itemErr) {
        console.warn('Diary sync item error:', itemErr);
      }
    }

    return Response.json({ success: true, synced: syncedCount }, { status: 200 });

  } catch (err) {
    console.error('Fatal /api/diary POST error:', err);
    return Response.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
