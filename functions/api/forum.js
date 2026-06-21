export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (id) {
    // Get single topic
    const topic = await env.DB.prepare(
      `SELECT t.id, t.title, t.content, t.created_at, t.location_address, u.name, u.avatar_url, u.trust_score
       FROM forum_topics t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = ? AND t.status = 'active' AND u.is_shadow_banned = 0`
    ).bind(id).first();

    if (!topic) return Response.json({ error: 'Topic not found' }, { status: 404 });

    // Get replies
    const replies = await env.DB.prepare(
      `SELECT r.id, r.reply_text, r.created_at, u.name, u.avatar_url, u.trust_score
       FROM forum_replies r
       JOIN users u ON r.user_id = u.id
       WHERE r.topic_id = ? AND r.status = 'active' AND u.is_shadow_banned = 0
       ORDER BY r.created_at ASC`
    ).bind(id).all();

    return Response.json({ topic, replies: replies.results });
  } else {
    // Get all topics
    const topics = await env.DB.prepare(
      `SELECT t.id, t.title, t.content, t.created_at, t.location_address, u.name, 
        (SELECT COUNT(*) FROM forum_replies r WHERE r.topic_id = t.id AND r.status = 'active') as reply_count
       FROM forum_topics t
       JOIN users u ON t.user_id = u.id
       WHERE t.status = 'active' AND u.is_shadow_banned = 0
       ORDER BY t.created_at DESC
       LIMIT 50`
    ).all();
    
    return Response.json(topics.results);
  }
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (!user) return Response.json({ error: 'Login required' }, { status: 401 });
  if (user.is_shadow_banned) {
    return Response.json({ success: true });
  }
  if (!user.has_accepted_rules) {
    return Response.json({ error: 'Please accept community guidelines first' }, { status: 403 });
  }

  const body = await request.json();
  const { action, title, content, topic_id, reply_text, location_address } = body;

  const blockedKeywords = ['bjp', 'congress', 'hindu', 'muslim', 'islam', 'christian', 'modi', 'rahul', 'politics', 'धर्म', 'राजनीति', 'गाली', 'chutiya', 'madarchod', 'bhenchod', 'scam'];
  
  if (action === 'create_topic') {
    if (!title || !content) return Response.json({ error: 'Title and content required' }, { status: 400 });
    
    const combinedText = (title + ' ' + content).toLowerCase();
    for (const kw of blockedKeywords) {
      if (combinedText.includes(kw)) {
        return Response.json({ error: 'आपका पोस्ट हमारी कम्युनिटी गाइडलाइन्स के खिलाफ है।' }, { status: 400 });
      }
    }

    await env.DB.prepare(
      'INSERT INTO forum_topics (user_id, title, content, location_address) VALUES (?, ?, ?, ?)'
    ).bind(user.id, title.trim(), content.trim(), location_address ? location_address.trim() : null).run();
    
    return Response.json({ success: true });
  } 
  else if (action === 'reply') {
    if (!topic_id || !reply_text) return Response.json({ error: 'Topic ID and reply text required' }, { status: 400 });
    
    const lowerText = reply_text.toLowerCase();
    for (const kw of blockedKeywords) {
      if (lowerText.includes(kw)) {
        return Response.json({ error: 'आपका मैसेज हमारी कम्युनिटी गाइडलाइन्स के खिलाफ है।' }, { status: 400 });
      }
    }

    await env.DB.prepare(
      'INSERT INTO forum_replies (topic_id, user_id, reply_text) VALUES (?, ?, ?)'
    ).bind(topic_id, user.id, reply_text.trim()).run();

    return Response.json({ success: true });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
