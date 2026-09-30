function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

async function handleEnquiry(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, message: 'Method not allowed.' }, 405)
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return jsonResponse({ success: false, message: 'Content-Type must be application/json.' }, 415)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ success: false, message: 'Invalid JSON request body.' }, 400)
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return jsonResponse({ success: false, message: 'Invalid enquiry.' }, 400)
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const query = typeof body.query === 'string' ? body.query.trim() : ''

  if (!name || !email || !phone) {
    return jsonResponse({ success: false, message: 'Name, email, and phone are required.' }, 400)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ success: false, message: 'Enter a valid email address.' }, 400)
  }

  const enquiryNumber = `ENQ-${crypto.randomUUID()}`
  const createdAt = new Date().toISOString()

  try {
    const result = await env.jarama_enquiries
      .prepare(
        'INSERT INTO enquiries (enquiry_number, created_at, name, email, phone, query) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(enquiryNumber, createdAt, name, email, phone, query)
      .run()

    if (!result.success) {
      return jsonResponse({ success: false, message: 'Unable to save your enquiry.' }, 500)
    }
  } catch {
    return jsonResponse({ success: false, message: 'Unable to save your enquiry.' }, 500)
  }

  return jsonResponse({ success: true }, 201)
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/enquiry') {
      return handleEnquiry(request, env)
    }

    if (pathname.startsWith('/api/')) {
      return jsonResponse({ success: false, message: 'Not found.' }, 404)
    }

    return env.ASSETS.fetch(request)
  },
}