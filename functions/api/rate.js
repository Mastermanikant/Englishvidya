export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return Response.json({ error: 'slug required' }, { status: 400 });

  const cached = await context.env.DB.prepare(
    'SELECT total_stars, total_votes, avg_rating FROM ratings_cache WHERE page_slug = ?'
  ).bind(slug).first();

  return Response.json({
    slug,
    totalVotes: cached ? cached.total_votes : 0,
    avgRating: cached ? cached.avg_rating : 0,
    userRating: null, // Frontend will check localStorage for guest state
  });
}

export async function onRequestPost(context) {
  const user = context.data.user;
  if (!user) return Response.json({ error: 'Login required to rate' }, { status: 401 });

  const body = await context.request.json();
  const { slug, stars } = body;

  if (!slug || !stars || stars < 1 || stars > 5) {
    return Response.json({ error: 'Invalid data' }, { status: 400 });
  }

  // Upsert rating
  await context.env.DB.prepare(
    'INSERT INTO ratings (page_slug, user_id, stars) VALUES (?, ?, ?) ON CONFLICT(page_slug, user_id) DO UPDATE SET stars = ?'
  ).bind(slug, user.id, stars, stars).run();

  // Update ratings_cache
  const agg = await context.env.DB.prepare(
    'SELECT COUNT(*) as cnt, SUM(stars) as total FROM ratings WHERE page_slug = ?'
  ).bind(slug).first();

  const avgRating = agg.cnt > 0 ? (agg.total / agg.cnt) : 0;

  await context.env.DB.prepare(
    `INSERT INTO ratings_cache (page_slug, total_stars, total_votes, avg_rating, updated_at) 
     VALUES (?, ?, ?, ?, datetime('now')) 
     ON CONFLICT(page_slug) DO UPDATE SET total_stars = ?, total_votes = ?, avg_rating = ?, updated_at = datetime('now')`
  ).bind(slug, agg.total, agg.cnt, avgRating, agg.total, agg.cnt, avgRating).run();

  return Response.json({ success: true, totalVotes: agg.cnt, avgRating });
}
