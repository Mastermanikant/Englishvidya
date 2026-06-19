export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { amount } = await request.json();

    if (!amount || isNaN(amount) || amount <= 0) {
      return Response.json({ success: false, error: 'Invalid coin amount.' }, { status: 400 });
    }

    if (amount < 100) {
      return Response.json({ success: false, error: 'Minimum redemption is 100 coins (₹1).' }, { status: 400 });
    }

    // 1. Get user's current coins
    const userInfo = await env.DB.prepare('SELECT referral_coins FROM users WHERE id = ?').bind(user.id).first();
    if (!userInfo) {
      return Response.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    if (userInfo.referral_coins < amount) {
      return Response.json({ success: false, error: 'Insufficient coin balance.' }, { status: 400 });
    }

    // 2. Generate discount coupon (100 coins = ₹1)
    const discountRupees = Math.floor(amount / 100);
    const uniqueHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    const promoCode = `FB-EV-${uniqueHash}-${discountRupees}`;

    // 3. Update database: deduct coins and write transaction in batch to keep load minimal
    const statements = [
      env.DB.prepare('UPDATE users SET referral_coins = referral_coins - ? WHERE id = ?').bind(amount, user.id),
      env.DB.prepare(
        'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, ?, "redemption", ?)'
      ).bind(user.id, -amount, `Redeemed coins for promo code: ${promoCode}`)
    ];

    await env.DB.batch(statements);

    return Response.json({
      success: true,
      promo_code: promoCode,
      discount_rupees: discountRupees,
      coins_redeemed: amount,
      remaining_coins: userInfo.referral_coins - amount
    });

  } catch (err) {
    return Response.json({ success: false, error: 'Database error: ' + err.message }, { status: 500 });
  }
}
