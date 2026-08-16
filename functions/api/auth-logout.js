export async function onRequestGet(context) {
  const headers = new Headers();
  headers.append('Location', '/');
  headers.append('Set-Cookie', 'ev_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  headers.append('Set-Cookie', 'ev_oauth_csrf=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  
  return new Response(null, {
    status: 302,
    headers
  });
}
