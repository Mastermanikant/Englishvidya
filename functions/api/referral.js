export async function onRequestGet(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 1. Fetch user's latest coin balance and active time directly from DB
    const userInfo = await env.DB.prepare(
      'SELECT username, referral_coins, active_seconds, created_at FROM users WHERE id = ?'
    ).bind(user.id).first();

    if (!userInfo) {
      return new Response('User not found', { status: 404 });
    }

    // 2. Fetch list of people referred by this user
    const referrals = await env.DB.prepare(
      `SELECT name, active_seconds, created_at, referrer_bonus_paid 
       FROM users 
       WHERE referred_by_id = ? 
       ORDER BY created_at DESC`
    ).bind(user.id).all();

    // 3. Fetch latest 20 coin transactions
    const transactions = await env.DB.prepare(
      `SELECT amount, type, description, created_at 
       FROM coin_transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 20`
    ).bind(user.id).all();

    return Response.json({
      username: userInfo.username,
      referral_coins: userInfo.referral_coins,
      active_seconds: userInfo.active_seconds,
      created_at: userInfo.created_at,
      referrals: referrals.results,
      transactions: transactions.results
    });

  } catch (err) {
    return new Response('Something went wrong. Please try again later.', { status: 500 });
  }
}
