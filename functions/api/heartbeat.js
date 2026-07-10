export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 1. Get current stats
    const stats = await env.DB.prepare(
      'SELECT referred_by_id, active_seconds, referrer_bonus_paid, referred_bonus_paid FROM users WHERE id = ?'
    ).bind(user.id).first();

    if (!stats) {
      return new Response('User not found', { status: 404 });
    }

    const newActiveSeconds = stats.active_seconds + 60;
    const threshold = 10800; // 3 hours (180 minutes)

    let awardUser = false;
    let awardReferrer = false;

    if (newActiveSeconds >= threshold) {
      if (stats.referred_bonus_paid === 0) {
        awardUser = true;
      }
      if (stats.referred_by_id && stats.referrer_bonus_paid === 0) {
        awardReferrer = true;
      }
    }

    // 2. Perform updates in a batch to save D1 connection overhead & keep server load minimal
    const statements = [];
    
    // Always update active_seconds
    statements.push(
      env.DB.prepare('UPDATE users SET active_seconds = ? WHERE id = ?').bind(newActiveSeconds, user.id)
    );

    // If milestone reached, award coins
    if (awardUser) {
      statements.push(
        env.DB.prepare('UPDATE users SET referral_coins = referral_coins + 900, referred_bonus_paid = 1 WHERE id = ?').bind(user.id)
      );
      statements.push(
        env.DB.prepare(
          'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 900, "active_bonus", "Completed 3 hours of active study")'
        ).bind(user.id)
      );
    }

    if (awardReferrer) {
      statements.push(
        env.DB.prepare('UPDATE users SET referral_coins = referral_coins + 900, referrer_bonus_paid = 1 WHERE id = ?').bind(stats.referred_by_id)
      );
      statements.push(
        env.DB.prepare(
          'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 900, "referral_active", ?)'
        ).bind(stats.referred_by_id, `Referred friend (User ID: ${user.id}) completed 3 hours of study`)
      );
    }

    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return Response.json({
      success: true,
      active_seconds: newActiveSeconds,
      milestone_reached: newActiveSeconds >= threshold,
      user_awarded: awardUser,
      referrer_awarded: awardReferrer
    });

  } catch (err) {
    return new Response('Something went wrong. Please try again later.', { status: 500 });
  }
}
