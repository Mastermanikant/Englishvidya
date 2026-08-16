export async function onRequestGet() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': 'token=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Strict'
    }
  });
}
