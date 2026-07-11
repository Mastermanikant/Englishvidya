export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 1. Increment active_seconds atomically and get updated stats
    const stats = await env.DB.prepare(
      'UPDATE users SET active_seconds = active_seconds + 60 WHERE id = ? RETURNING active_seconds, referred_by_id, referrer_bonus_paid, referred_bonus_paid'
    ).bind(user.id).first();

    if (!stats) {
      return new Response('User not found', { status: 404 });
    }

    const newActiveSeconds = stats.active_seconds;
    const threshold = 10800; // 3 hours (180 minutes)

    let awardUser = false;
    let awardReferrer = false;

    if (newActiveSeconds >= threshold) {
      // Attempt to award user atomically
      if (stats.referred_bonus_paid === 0) {
        const userAwardRes = await env.DB.prepare(
          'UPDATE users SET referral_coins = referral_coins + 900, referred_bonus_paid = 1 WHERE id = ? AND referred_bonus_paid = 0 RETURNING id'
        ).bind(user.id).first();

        if (userAwardRes) {
          awardUser = true;
          await env.DB.prepare(
            'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 900, "active_bonus", "Completed 3 hours of active study")'
          ).bind(user.id).run();
        }
      }

      // Attempt to award referrer atomically
      if (stats.referred_by_id && stats.referrer_bonus_paid === 0) {
        // First, atomically mark the bonus as paid on the student's record
        const refFlagRes = await env.DB.prepare(
          'UPDATE users SET referrer_bonus_paid = 1 WHERE id = ? AND referrer_bonus_paid = 0 RETURNING id'
        ).bind(user.id).first();

        if (refFlagRes) {
          awardReferrer = true;
          // Then credit the referrer and log transaction
          const statements = [
            env.DB.prepare('UPDATE users SET referral_coins = referral_coins + 900 WHERE id = ?').bind(stats.referred_by_id),
            env.DB.prepare(
              'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 900, "referral_active", ?)'
            ).bind(stats.referred_by_id, `Referred friend (User ID: ${user.id}) completed 3 hours of study`)
          ];
          await env.DB.batch(statements);
        }
      }
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
