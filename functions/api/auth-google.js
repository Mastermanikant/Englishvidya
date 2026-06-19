export async function onRequestGet(context) {
  const { request, env } = context;
  const urlParams = new URL(request.url).searchParams;
  const redirectTo = urlParams.get('redirect') || '/';
  
  const redirectUri = `${env.SITE_URL}/api/auth-callback`;
  const scope = 'openid email profile';
  // Use state to pass the redirect URL safely
  const state = encodeURIComponent(redirectTo);

  const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}` +
    `&prompt=select_account`;

  return Response.redirect(url, 302);
}
