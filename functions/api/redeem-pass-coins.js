export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const cost = 1000; // 1000 coins = 24 Hours Ad-Free Pass
    const durationMs = 86400000; // 24 hours in milliseconds

    // 1. Get user's current coins
    const userInfo = await env.DB.prepare('SELECT referral_coins FROM users WHERE id = ?').bind(user.id).first();
    if (!userInfo) {
      return Response.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    if (userInfo.referral_coins < cost) {
      return Response.json({ success: false, error: 'Insufficient coin balance (कम से कम 1,000 कॉइन्स आवश्यक हैं)।' }, { status: 400 });
    }

    const expiresAt = Date.now() + durationMs;

    // 2. Update database: deduct coins and write transaction in batch
    const statements = [
      env.DB.prepare('UPDATE users SET referral_coins = referral_coins - ? WHERE id = ?').bind(cost, user.id),
      env.DB.prepare(
        'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, ?, "redemption", "Activated 24-Hour Ad-Free Premium Pass using coins")'
      ).bind(user.id, -cost)
    ];

    await env.DB.batch(statements);

    return Response.json({
      success: true,
      expires_at: expiresAt,
      coins_redeemed: cost,
      remaining_coins: userInfo.referral_coins - cost
    });

  } catch (err) {
    return Response.json({ success: false, error: 'Something went wrong. Please try again later.' }, { status: 500 });
  }
}
