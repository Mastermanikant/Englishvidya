export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const cost = 1000; // 1000 coins = 24 Hours Ad-Free Pass
    const durationMs = 86400000; // 24 hours in milliseconds

    // Update database: deduct coins atomically and return the new balance
    const updateResult = await env.DB.prepare(
      'UPDATE users SET referral_coins = referral_coins - ? WHERE id = ? AND referral_coins >= ? RETURNING referral_coins'
    ).bind(cost, user.id, cost).first();

    if (!updateResult) {
       return Response.json({ success: false, error: 'Insufficient coin balance (कम से कम 1,000 कॉइन्स आवश्यक हैं) या नेटवर्क एरर।' }, { status: 400 });
    }

    const expiresAt = Date.now() + durationMs;

    // Insert the transaction record
    await env.DB.prepare(
      'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, ?, "redemption", "Activated 24-Hour Ad-Free Premium Pass using coins")'
    ).bind(user.id, -cost).run();

    return Response.json({
      success: true,
      expires_at: expiresAt,
      coins_redeemed: cost,
      remaining_coins: updateResult.referral_coins
    });

  } catch (err) {
    return Response.json({ success: false, error: 'Something went wrong. Please try again later.' }, { status: 500 });
  }
}
