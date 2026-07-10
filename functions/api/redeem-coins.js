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

    // 1. Generate discount coupon (100 coins = ₹1)
    const discountRupees = Math.floor(amount / 100);
    const uniqueHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    const promoCode = `FB-EV-${uniqueHash}-${discountRupees}`;

    // 2. Atomic Update: Deduct coins only if user has enough
    const updateResult = await env.DB.prepare(
      'UPDATE users SET referral_coins = referral_coins - ? WHERE id = ? AND referral_coins >= ?'
    ).bind(amount, user.id, amount).run();

    if (updateResult.meta.changes === 0) {
      return Response.json({ success: false, error: 'Insufficient coin balance.' }, { status: 400 });
    }

    // 3. Log Transaction
    await env.DB.prepare(
      'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, ?, "redemption", ?)'
    ).bind(user.id, -amount, `Redeemed coins for promo code: ${promoCode}`).run();

    // 4. Get remaining coins
    const userInfo = await env.DB.prepare('SELECT referral_coins FROM users WHERE id = ?').bind(user.id).first();

    return Response.json({
      success: true,
      promo_code: promoCode,
      discount_rupees: discountRupees,
      coins_redeemed: amount,
      remaining_coins: userInfo ? userInfo.referral_coins : 0
    });

  } catch (err) {
    return Response.json({ success: false, error: 'Something went wrong. Please try again later.' }, { status: 500 });
  }
}
