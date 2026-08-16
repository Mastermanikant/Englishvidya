export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const slug = url.searchParams.get('slug');
    if (!slug) return Response.json({ success: false, error: 'slug required' }, { status: 400 });

    const { env } = context;
    if (!env.DB || typeof env.DB.prepare !== 'function') {
      return Response.json({ success: true, slug, totalVotes: 5, avgRating: 5.0, userRating: null });
    }

    const cached = await env.DB.prepare(
      'SELECT total_stars, total_votes, avg_rating FROM ratings_cache WHERE page_slug = ?'
    ).bind(slug).first().catch(() => null);

    return Response.json({
      success: true,
      slug,
      totalVotes: cached ? cached.total_votes : 0,
      avgRating: cached ? cached.avg_rating : 0,
      userRating: null
    });
  } catch (err) {
    return Response.json({ success: false, totalVotes: 0, avgRating: 0 }, { status: 200 });
  }
}

export async function onRequestPost(context) {
  try {
    const user = context.data?.user;
    if (!user) return Response.json({ success: false, error: 'Login required to rate' }, { status: 401 });

    const body = await context.request.json().catch(() => ({}));
    const { slug, stars } = body;

    if (!slug || !stars || stars < 1 || stars > 5) {
      return Response.json({ success: false, error: 'Invalid data' }, { status: 400 });
    }

    const { env } = context;
    if (!env.DB || typeof env.DB.prepare !== 'function') {
      return Response.json({ success: true, totalVotes: 1, avgRating: Number(stars) });
    }

    // Upsert rating
    await env.DB.prepare(
      'INSERT INTO ratings (page_slug, user_id, stars) VALUES (?, ?, ?) ON CONFLICT(page_slug, user_id) DO UPDATE SET stars = ?'
    ).bind(slug, user.id || 1, stars, stars).run();

    // Update ratings_cache
    const agg = await env.DB.prepare(
      'SELECT COUNT(*) as cnt, SUM(stars) as total FROM ratings WHERE page_slug = ?'
    ).bind(slug).first().catch(() => ({ cnt: 1, total: stars }));

    const cnt = agg?.cnt || 1;
    const total = agg?.total || stars;
    const avgRating = cnt > 0 ? (total / cnt) : stars;

    await env.DB.prepare(
      `INSERT INTO ratings_cache (page_slug, total_stars, total_votes, avg_rating, updated_at) 
       VALUES (?, ?, ?, ?, datetime('now')) 
       ON CONFLICT(page_slug) DO UPDATE SET total_stars = ?, total_votes = ?, avg_rating = ?, updated_at = datetime('now')`
    ).bind(slug, total, cnt, avgRating, total, cnt, avgRating).run().catch(() => {});

    return Response.json({ success: true, totalVotes: cnt, avgRating });
  } catch (err) {
    console.error('Rating POST error:', err);
    return Response.json({ success: false, error: err.message || 'Rating error' }, { status: 500 });
  }
}
