addEventListener('fetch', event =>
  event.respondWith(handleRequest(event.request)),
)

// Verbose handling here to avoid chicken/egg errors when setting up project
if (typeof CLIENT_ID !== 'undefined') {
  const client_id = CLIENT_ID
} else {
  const client_id = null
}
if (typeof CLIENT_SECRET !== 'undefined') {
  const client_secret = CLIENT_SECRET
} else {
  const client_secret = null
}

function renderBody(status, content) {
  const html = `
    <script>
      const receiveMessage = (message) => {
        window.opener.postMessage(
          'authorization:github:${status}:${JSON.stringify(content)}',
          message.origin
        );
        window.removeEventListener("message", receiveMessage, false);
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    </script>
  `
  const blob = new Blob([html])
  return blob
}

async function handleRequest(req) {
  try {
    const url = new URL(req.url)
    if (url.pathname === '/auth') {
      const redirectUrl = new URL('https://github.com/login/oauth/authorize')
      redirectUrl.searchParams.set('client_id', client_id)
      redirectUrl.searchParams.set('redirect_uri', `${url.origin}/callback`)
      redirectUrl.searchParams.set('scope', 'repo user')
      redirectUrl.searchParams.set(
        'state',
        crypto.getRandomValues(new Uint8Array(12)).join(''),
      )
      return Response.redirect(redirectUrl.href, 301)
    }
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code')
      const response = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'user-agent': 'cloudflare-worker-github-oauth-login-demo',
            accept: 'application/json',
          },
          body: JSON.stringify({ client_id, client_secret, code }),
        },
      )
      const result = await response.json()
      if (result.error) {
        return new Response(renderBody('error', result), { status: 401 })
      }
      const token = result.access_token
      const provider = 'github'
      const responseBody = renderBody('success', {
        token,
        provider,
      })
      return new Response(responseBody, { status: 200 })
    }
  } catch (error) {
    console.error(error)
    return new Response(error.message, {
      status: 500,
    })
  }
}
