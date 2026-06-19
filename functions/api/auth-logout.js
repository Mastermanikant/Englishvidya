export async function onRequestGet(context) {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': 'ev_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
}
