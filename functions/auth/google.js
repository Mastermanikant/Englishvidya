export async function onRequestGet(context) {
  const { env } = context;
  const clientId = env.GOOGLE_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID';
  const redirectUri = new URL('/auth/callback', context.request.url).toString();
  const scope = 'openid email profile';
  const responseType = 'code';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=offline`;
  
  return Response.redirect(authUrl, 302);
}
