export async function onRequestGet(context) {
  const { env } = context;
  const redirectUri = `${env.SITE_URL}/api/auth-callback`;
  const scope = 'openid email profile';

  const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&prompt=select_account`;

  return Response.redirect(url, 302);
}
