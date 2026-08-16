export async function onRequestGet(context) {
  const user = context.data?.user;
  const noCacheHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  if (!user) {
    return new Response(JSON.stringify({ loggedIn: false, user: null }), {
      status: 200,
      headers: noCacheHeaders
    });
  }

  return new Response(JSON.stringify({
    loggedIn: true,
    user: {
      id: user.id || 1,
      name: user.name || 'Student',
      email: user.email || '',
      avatar_url: user.avatar_url || '',
      role: user.role || 'learner'
    }
  }), {
    status: 200,
    headers: noCacheHeaders
  });
}
