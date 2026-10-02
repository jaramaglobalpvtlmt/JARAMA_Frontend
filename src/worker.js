function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

async function sendEnquiryNotification(env, enquiry) {
  if (!env.RESEND_API_KEY || !env.ENQUIRY_NOTIFICATION_EMAIL) {
    return false
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'JARAMA GLOBAL TRADE <website@jaramaglobaltrade.com>',
      to: [env.ENQUIRY_NOTIFICATION_EMAIL],
      subject: 'New Website Enquiry — JARAMA GLOBAL TRADE',
      text: [
        `Enquiry number: ${enquiry.enquiryNumber}`,
        `Date/time: ${enquiry.createdAt}`,
        `Name: ${enquiry.name}`,
        `Email: ${enquiry.email}`,
        `Phone: ${enquiry.phone}`,
        `Query: ${enquiry.query}`,
      ].join('\n'),
    }),
  })

  return response.ok
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

  try {
    const notificationSent = await sendEnquiryNotification(env, {
      enquiryNumber,
      createdAt,
      name,
      email,
      phone,
      query,
    })

    if (!notificationSent) {
      return jsonResponse(
        {
          success: false,
          code: 'EMAIL_NOTIFICATION_FAILED',
          message: 'Your enquiry was saved, but its email notification could not be sent.',
        },
        502,
      )
    }
  } catch {
    return jsonResponse(
      {
        success: false,
        code: 'EMAIL_NOTIFICATION_FAILED',
        message: 'Your enquiry was saved, but its email notification could not be sent.',
      },
      502,
    )
  }

  return jsonResponse({ success: true }, 201)
}

async function handleFaqCategories(request, env) {
  if (request.method !== 'GET') {
    return jsonResponse({ success: false, message: 'Method not allowed.' }, 405)
  }

  try {
    const result = await env.jarama_enquiries
      .prepare(
        `SELECT
          id,
          name,
          description,
          display_order
        FROM faq_categories
        WHERE is_active = 1
        ORDER BY display_order ASC;`,
      )
      .all()

    return jsonResponse({ success: true, data: result.results || [] }, 200)
  } catch {
    return jsonResponse({ success: false, message: 'Sorry, I\'m unable to load the Quick Chat options right now. Please use our Contact or Enquiry form.' }, 500)
  }
}

async function handleFaqsByCategory(request, env, categoryId) {
  if (request.method !== 'GET') {
    return jsonResponse({ success: false, message: 'Method not allowed.' }, 405)
  }

  try {
    const result = await env.jarama_enquiries
      .prepare(
        `SELECT
          id,
          category_id,
          button_label,
          question,
          answer,
          action_type,
          action_value,
          display_order
        FROM faqs
        WHERE category_id = ?
          AND is_active = 1
        ORDER BY display_order ASC;`,
      )
      .bind(categoryId)
      .all()

    return jsonResponse({ success: true, data: result.results || [] }, 200)
  } catch {
    return jsonResponse({ success: false, message: 'Sorry, I\'m unable to load the Quick Chat options right now. Please use our Contact or Enquiry form.' }, 500)
  }
}

function normalizeFaqText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

async function handleFaqSearch(request, env) {
  if (request.method !== 'GET') {
    return jsonResponse({ success: false, message: 'Method not allowed.' }, 405)
  }

  const query = new URL(request.url).searchParams.get('q')?.trim() || ''
  if (!query || query.length > 200) {
    return jsonResponse({ success: false, message: 'Enter a search query.' }, 400)
  }

  const normalizedQuery = normalizeFaqText(query)
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'can', 'cant', 'could', 'do',
    'does', 'for', 'from', 'how', 'i', 'in', 'is', 'it', 'me', 'my', 'of',
    'on', 'or', 'our', 'please', 'the', 'to', 'we', 'what', 'when', 'where',
    'which', 'who', 'why', 'with', 'would', 'you', 'your',
  ])
  const keywords = [...new Set(normalizedQuery.split(/\s+/).filter((word) => word.length > 1 && !stopWords.has(word)))].slice(0, 10)

  if (!keywords.length) {
    return jsonResponse({ success: true, data: null }, 200)
  }

  try {
    const result = await env.jarama_enquiries
      .prepare(
        `SELECT
          f.id,
          f.category_id,
          c.name AS category_name,
          f.button_label,
          f.question,
          f.answer,
          f.action_type,
          f.action_value,
          f.display_order
        FROM faqs AS f
        INNER JOIN faq_categories AS c ON c.id = f.category_id
        WHERE f.is_active = 1
          AND c.is_active = 1;`,
      )
      .all()

    const rankedFaqs = (result.results || [])
      .map((faq) => {
        const categoryName = normalizeFaqText(faq.category_name)
        const label = normalizeFaqText(faq.button_label)
        const questionText = normalizeFaqText(faq.question)
        const answer = normalizeFaqText(faq.answer)
        let score = 0
        let matchedKeywords = 0

        for (const keyword of keywords) {
          if (categoryName.includes(keyword)) {
            score += 6
            matchedKeywords += 1
          }

          if (label.includes(keyword)) {
            score += 4
          } else if (questionText.includes(keyword)) {
            score += 3
          } else if (answer.includes(keyword)) {
            score += 1
          } else if (!categoryName.includes(keyword)) {
            continue
          }

          matchedKeywords += 1
        }

        if (categoryName.includes(normalizedQuery)) {
          score += 12
        } else if (label.includes(normalizedQuery) || questionText.includes(normalizedQuery)) {
          score += 8
        }

        return { faq, score, matchedKeywords }
      })
      .filter((match) => match.score > 0)
      .sort((first, second) =>
        second.score - first.score ||
        second.matchedKeywords - first.matchedKeywords ||
        first.faq.display_order - second.faq.display_order,
      )

    const bestMatch = rankedFaqs[0]?.faq
    if (bestMatch) {
      const { category_name: _categoryName, ...faq } = bestMatch
      return jsonResponse({ success: true, data: faq }, 200)
    }

    return jsonResponse({ success: true, data: null }, 200)
  } catch {
    return jsonResponse({ success: false, message: 'Sorry, I\'m unable to search Quick Chat right now. Please use our Contact or Enquiry form.' }, 500)
  }
}

async function handleFaqById(request, env, faqId) {
  if (request.method !== 'GET') {
    return jsonResponse({ success: false, message: 'Method not allowed.' }, 405)
  }

  try {
    const result = await env.jarama_enquiries
      .prepare(
        `SELECT
          id,
          category_id,
          button_label,
          question,
          answer,
          action_type,
          action_value,
          display_order
        FROM faqs
        WHERE id = ?
          AND is_active = 1;`,
      )
      .bind(faqId)
      .first()

    if (!result) {
      return jsonResponse({ success: false, message: 'Not found.' }, 404)
    }

    return jsonResponse({ success: true, data: result }, 200)
  } catch {
    return jsonResponse({ success: false, message: 'Sorry, I\'m unable to load the Quick Chat options right now. Please use our Contact or Enquiry form.' }, 500)
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/enquiry') {
      return handleEnquiry(request, env)
    }

    if (pathname === '/api/faq/categories') {
      return handleFaqCategories(request, env)
    }

    if (pathname === '/api/faq/search') {
      return handleFaqSearch(request, env)
    }

    const categoryMatch = pathname.match(/^\/api\/faq\/categories\/(\d+)\/faqs$/)
    if (categoryMatch) {
      return handleFaqsByCategory(request, env, Number(categoryMatch[1]))
    }

    const faqMatch = pathname.match(/^\/api\/faq\/(\d+)$/)
    if (faqMatch) {
      return handleFaqById(request, env, Number(faqMatch[1]))
    }

    if (pathname.startsWith('/api/')) {
      return jsonResponse({ success: false, message: 'Not found.' }, 404)
    }

    return env.ASSETS.fetch(request)
  },
}