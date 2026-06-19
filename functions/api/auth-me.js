export async function onRequestGet(context) {
  const user = context.data.user;
  if (!user) {
    return Response.json({ loggedIn: false, user: null });
  }
  return Response.json({
    loggedIn: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      trust_score: user.trust_score,
      social_instagram: user.social_instagram,
      social_facebook: user.social_facebook,
      social_youtube: user.social_youtube,
      social_twitter: user.social_twitter,
      social_linkedin: user.social_linkedin,
      social_pinterest: user.social_pinterest,
      social_website1: user.social_website1,
      social_website2: user.social_website2,
      delete_requested_at: user.delete_requested_at,
      has_accepted_rules: user.has_accepted_rules
    }
  });
}
