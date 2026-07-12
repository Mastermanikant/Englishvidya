export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return Response.json({ error: 'slug required' }, { status: 400 });

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

  const comments = await context.env.DB.prepare(
    `SELECT c.id, c.comment_text, c.reference_links, c.created_at, u.name, u.avatar_url, u.trust_score,
            (SELECT stars FROM ratings r WHERE r.user_id = c.user_id AND r.page_slug = c.page_slug LIMIT 1) as user_rating
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.page_slug = ? AND u.is_shadow_banned = 0 AND c.status = 'active'
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(slug, limit, offset).all();

  // Filter reference links to only show approved ones to the public
  const publicComments = comments.results.map(c => {
    let approvedRefs = [];
    try {
      const refs = JSON.parse(c.reference_links || '[]');
      // Handle legacy array of strings or new array of objects
      approvedRefs = refs.filter(r => typeof r === 'string' || r.status === 'approved').map(r => typeof r === 'string' ? r : r.url);
    } catch(e) {}
    
    return {
      ...c,
      reference_links: JSON.stringify(approvedRefs)
    };
  });

  return Response.json(publicComments);
}

export async function onRequestPost(context) {
  const user = context.data.user;
  if (!user) return Response.json({ error: 'Login required to comment' }, { status: 401 });
  if (user.is_shadow_banned) {
    return Response.json({ success: true, message: 'Comment posted!' });
  }
  // Check agreement
  if (!user.has_accepted_rules) {
    return Response.json({ error: 'Please accept community guidelines first' }, { status: 403 });
  }

  const body = await context.request.json();
  const { slug, text, references } = body;

  if (!slug || !text || text.trim() === '') {
    return Response.json({ error: 'Comment text required' }, { status: 400 });
  }

  if (text.length > 5000) {
    return Response.json({ error: 'कमेंट ५००० अक्षरों से कम होना चाहिए।' }, { status: 400 });
  }

  const cleanText = text.trim();

  // Rate Limiting: 1 comment every 15 seconds
  const lastComment = await context.env.DB.prepare(
    'SELECT created_at FROM comments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(user.id).first();

  if (lastComment) {
    const lastTime = new Date(lastComment.created_at).getTime();
    const nowTime = Date.now();
    if (nowTime - lastTime < 15000) {
      return Response.json({ error: 'कमेंट पोस्ट करने की गति बहुत तेज़ है। कृपया १५ सेकंड प्रतीक्षा करें।' }, { status: 429 });
    }
  }

  // Rule 1: No URLs in the main comment text
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/i;
  if (urlRegex.test(cleanText)) {
    return Response.json({ error: 'कमेंट में लिंक (URL) डालना सख्त मना है। कृपया नीचे "Reference Links" वाले बॉक्स का इस्तेमाल करें।' }, { status: 400 });
  }

  // Rule 2: Keyword Blocker (Politics, Religion, Abuses)
  const blockedKeywords = ['bjp', 'congress', 'hindu', 'muslim', 'islam', 'christian', 'modi', 'rahul', 'politics', 'धर्म', 'राजनीति', 'गाली', 'chutiya', 'madarchod', 'bhenchod', 'scam'];
  const lowerText = cleanText.toLowerCase();
  for (const kw of blockedKeywords) {
    if (lowerText.includes(kw)) {
      return Response.json({ error: 'आपका मैसेज हमारी कम्युनिटी गाइडलाइन्स (राजनीति, धर्म या अभद्र भाषा) के खिलाफ है।' }, { status: 400 });
    }
  }

  // Handle reference links (max 5) with strict protocol validation against XSS
  let refJson = '[]';
  if (Array.isArray(references)) {
    const validRefs = references
      .filter(l => typeof l === 'string' && l.trim().length > 0)
      .map(l => l.trim())
      .filter(l => {
        try {
          const parsed = new URL(l);
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch (e) {
          // If it doesn't parse as a full URL, we might want to reject it
          // or assume it's a domain and prepend https://, but strict is safer.
          return false; 
        }
      })
      .slice(0, 5);
      
    const refsWithStatus = validRefs.map(url => ({ url, status: 'pending' }));
    refJson = JSON.stringify(refsWithStatus);
  }

  await context.env.DB.prepare(
    'INSERT INTO comments (page_slug, user_id, comment_text, reference_links) VALUES (?, ?, ?, ?)'
  ).bind(slug, user.id, cleanText, refJson).run();

  return Response.json({ success: true, message: 'Comment posted!' });
}
