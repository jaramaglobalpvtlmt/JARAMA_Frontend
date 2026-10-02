import { useEffect, useRef, useState } from 'react'
import { siteConfig } from './siteConfig.js'
import './App.css'

const navigation = [
  {
    label: 'Home',
    href: '#home',
    description: 'A clear route into global trade.',
    links: [{ label: 'Welcome', href: '#home' }, { label: 'Our approach', href: '#about' }],
  },
  {
    label: 'Products',
    href: '#products',
    description: 'Trade support shaped around your next move.',
    links: [
      { label: 'Export solutions', href: '#products' },
      { label: 'Import solutions', href: '#products' },
      { label: 'Supply chain support', href: '#products' },
    ],
  },
  {
    label: 'About Us',
    href: '#about',
    description: 'A hands-on partner for cross-border business.',
    links: [{ label: 'Who we are', href: '#about' }, { label: 'Our principles', href: '#about' }],
  },
]

function App() {
  const [activeMenu, setActiveMenu] = useState(null)
  const [formStatus, setFormStatus] = useState('idle')
  const [formError, setFormError] = useState('')
  const isSubmittingEnquiry = useRef(false)
  const [faqCategories, setFaqCategories] = useState([])
  const [categoryFaqs, setCategoryFaqs] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedFaqId, setSelectedFaqId] = useState('')
  const [quickEnquiry, setQuickEnquiry] = useState('')
  const enquiryQueryRef = useRef(null)
  const chatLauncherRef = useRef(null)
  const [isQuickChatOpen, setIsQuickChatOpen] = useState(false)
  const [isQuickChatExpanded, setIsQuickChatExpanded] = useState(false)
  const [isQuickChatHighlighted, setIsQuickChatHighlighted] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(false)
  const [isSearchingFaq, setIsSearchingFaq] = useState(false)
  const [faqError, setFaqError] = useState('')
  const selectedCategory = faqCategories.find((category) => category.id === selectedCategoryId)
  const selectedFaq = categoryFaqs.find((faq) => String(faq.id) === selectedFaqId)

  const faqLoadError = "Sorry, we're unable to load the Quick Chat options right now.\n\nPlease use our Contact or Enquiry option to reach us."

  const loadFaqCategories = async () => {
    try {
      const response = await fetch('/api/faq/categories')
      if (!response.ok) {
        throw new Error('Unable to load Quick Chat options right now.')
      }

      const payload = await response.json()
      const categories = Array.isArray(payload?.data) ? payload.data : []
      setFaqCategories(categories)
      setFaqError('')
      if (!categories.length) {
        setFaqError(faqLoadError)
      }
    } catch {
      setFaqError(faqLoadError)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const loadCategoryFaqs = async (categoryId) => {
    setIsLoadingFaqs(true)
    setFaqError('')

    try {
      const response = await fetch(`/api/faq/categories/${categoryId}/faqs`)
      if (!response.ok) {
        throw new Error('Unable to load the available questions.')
      }

      const payload = await response.json()
      const faqs = Array.isArray(payload?.data) ? payload.data : []
      setCategoryFaqs(faqs)
      if (!faqs.length) {
        setFaqError(faqLoadError)
      }
    } catch {
      setFaqError(faqLoadError)
    } finally {
      setIsLoadingFaqs(false)
    }
  }

  const handleFaqCategoryChange = (event) => {
    const categoryId = Number(event.currentTarget.value) || null
    setSelectedCategoryId(categoryId)
    setSelectedFaqId('')
    setCategoryFaqs([])
    setFaqError('')

    if (categoryId) {
      void loadCategoryFaqs(categoryId)
    }
  }

  const handleBackToQuickChat = () => {
    setSelectedCategoryId(null)
    setSelectedFaqId('')
    setCategoryFaqs([])
    setFaqError('')
  }

  const handleQuickEnquirySubmit = async (event) => {
    event.preventDefault()
    const query = quickEnquiry.trim()
    if (!query || isSearchingFaq) return

    setIsSearchingFaq(true)
    setFaqError('')

    try {
      const searchResponse = await fetch(`/api/faq/search?q=${encodeURIComponent(query)}`)
      if (!searchResponse.ok) throw new Error('FAQ search failed.')
      const searchPayload = await searchResponse.json()
      let matchedFaq = searchPayload?.data
      let matchedCategory

      if (matchedFaq) {
        matchedCategory = faqCategories.find((category) => category.id === matchedFaq.category_id)
      } else {
        let categories = faqCategories
        if (!categories.length) {
          const categoriesResponse = await fetch('/api/faq/categories')
          if (!categoriesResponse.ok) throw new Error('FAQ categories unavailable.')
          const categoriesPayload = await categoriesResponse.json()
          categories = Array.isArray(categoriesPayload?.data) ? categoriesPayload.data : []
          setFaqCategories(categories)
        }

        matchedCategory = categories.find((category) => category.name.trim().toLowerCase() === 'contact & enquiries')
        if (!matchedCategory) throw new Error('Contact category unavailable.')

        const fallbackResponse = await fetch(`/api/faq/categories/${matchedCategory.id}/faqs`)
        if (!fallbackResponse.ok) throw new Error('Fallback FAQ unavailable.')
        const fallbackPayload = await fallbackResponse.json()
        const fallbackFaqs = Array.isArray(fallbackPayload?.data) ? fallbackPayload.data : []
        matchedFaq = fallbackFaqs.find((faq) => {
          const buttonLabel = String(faq.button_label || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
          const question = String(faq.question || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
          return buttonLabel === 'cant find an answer' || question.includes('cant find an answer')
        })
      }

      if (!matchedFaq || !matchedCategory) throw new Error('No matching FAQ found.')

      setSelectedCategoryId(matchedCategory.id)
      setCategoryFaqs([matchedFaq])
      setSelectedFaqId(String(matchedFaq.id))
    } catch {
      setFaqError(faqLoadError)
    } finally {
      setIsSearchingFaq(false)
    }
  }

  useEffect(() => {
    void loadFaqCategories()
  }, [])

  useEffect(() => {
    if (!isQuickChatOpen) return undefined

    const handleChatEscape = (event) => {
      if (event.key === 'Escape') {
        setIsQuickChatOpen(false)
        setIsQuickChatExpanded(false)
        setIsQuickChatHighlighted(false)
        chatLauncherRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleChatEscape)
    return () => window.removeEventListener('keydown', handleChatEscape)
  }, [isQuickChatOpen])

  async function handleEnquirySubmit(event) {
    event.preventDefault()
    if (isSubmittingEnquiry.current || formStatus === 'sending') return

    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    const enquiry = {
      name: String(formData.get('name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      query: String(formData.get('query') ?? '').trim(),
    }
    const emailInput = formElement.elements.namedItem('email')

    if (!enquiry.name || !enquiry.email || !enquiry.phone) {
      setFormStatus('error')
      setFormError('Please enter your name, email address, and phone number.')
      return
    }

    if (!emailInput.validity.valid) {
      setFormStatus('error')
      setFormError('Please enter a valid email address.')
      return
    }

    isSubmittingEnquiry.current = true
    setFormStatus('sending')
    setFormError('')
    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiry),
      })

      const responseIsJson = response.headers.get('content-type')?.includes('application/json')
      const responseBody = responseIsJson ? await response.json().catch(() => null) : null
      const apiReportedSuccess = response.status === 201 || (response.ok && responseBody?.success === true)
      if (!apiReportedSuccess) {
        const errorMessage = responseBody?.code === 'EMAIL_NOTIFICATION_FAILED'
          ? 'Your enquiry was saved, but its email notification could not be sent. Please contact us directly.'
          : 'The enquiry could not be sent. Please try again.'
        throw new Error(errorMessage)
      }
      formElement.reset()
      setFormStatus('sent')
      setFormError('')
    } catch (error) {
      setFormStatus('error')
      setFormError(error instanceof Error ? error.message : 'We could not send your enquiry. Please try again.')
    } finally {
      isSubmittingEnquiry.current = false
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#home" aria-label={`${siteConfig.companyName}, home`}>
          <img className="brand-logo" src="/LOGO.png" alt="" />
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const isOpen = activeMenu === item.label
            return (
              <div className={`nav-item${isOpen ? ' is-open' : ''}`} key={item.label}>
                <a
                  className="nav-link"
                  href={item.href}
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  onClick={(event) => {
                    if (window.matchMedia('(max-width: 760px)').matches) {
                      event.preventDefault()
                      setActiveMenu(isOpen ? null : item.label)
                    }
                  }}
                >
                  {item.label}<span aria-hidden="true" className="nav-caret">+</span>
                </a>
                <div className="nav-panel">
                  <p>{item.description}</p>
                  {item.links.map((link) => (
                    <a href={link.href} key={link.label} onClick={() => setActiveMenu(null)}>{link.label}<span aria-hidden="true">↗</span></a>
                  ))}
                </div>
              </div>
            )
          })}
          <a
            className="nav-enquire"
            href="#enquire"
            onClick={() => {
              setIsQuickChatOpen(true)
              setIsQuickChatExpanded(true)
              setIsQuickChatHighlighted(true)
            }}
          >
            Let’s talk <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main>
        <section className="hero-section" id="home">
          <img className="hero-image" src={siteConfig.heroImage} alt="Fresh vegetables prepared for global markets" />
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow light-eyebrow"><span /> Trade, made more human</p>
            <h1>Move beyond<br />your borders.</h1>
            <p className="hero-intro">A Vikarabad-based merchant exporter bringing spices, vegetables, and fruits to markets around the world.</p>
            <a className="hero-link" href="#products">Explore what we do <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-aside"><span>01 / 03</span><span>Global trade, made clear</span></div>
          <div className="hero-note"><span className="note-rule" />Built around your next move.</div>
        </section>

        <section className="intro-band" aria-label="Company introduction">
          <p className="eyebrow"><span /> Your link to what’s next</p>
          <p className="intro-statement">{siteConfig.companyName} is a merchant exporter incorporated on 15 July 2026, based in Vikarabad, Telangana.</p>
          <a className="text-link" href="#about">Meet JARAMA <span aria-hidden="true">↗</span></a>
        </section>

        <section className="products-section content-section" id="products">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span /> Our products</p>
              <h2>Grown with care,<br /><em>ready to travel.</em></h2>
            </div>
            <p className="section-summary">Fruits, vegetables, spices, and tamarind sourced for businesses looking to reach markets around the world.</p>
          </div>
          <div className="product-grid">
            {siteConfig.products.map((product) => (
              <article className="product-item" key={product.title}>
                <img className="product-image" src={product.image} alt={product.imageAlt} loading="lazy" />
                <div className="product-copy">
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  {product.credit && <a className="image-credit" href={product.credit.href} rel="noreferrer" target="_blank">Photo: {product.credit.label}</a>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="about-photo-wrap">
            <img src={siteConfig.aboutImage} alt="A colorful selection of spices" loading="lazy" />
            <span className="photo-caption">A wider view. A clearer way forward.</span>
          </div>
          <div className="about-copy">
            <p className="eyebrow light-eyebrow"><span /> A little about us</p>
            <p className="about-legal-name">{siteConfig.companyName}</p>
            <h2>Merchant exporter.<br /><em>Based in Telangana.</em></h2>
            <p>{siteConfig.aboutCopy}</p>
            <dl className="company-facts">
              <div>
                <dt>Exporter category</dt>
                <dd>{siteConfig.exporterCategory}</dd>
              </div>
              <div>
                <dt>Date of incorporation</dt>
                <dd>{siteConfig.dateOfIncorporation}</dd>
              </div>
              <div className="company-sourcing">
                <dt>Sourcing regions</dt>
                <dd>{siteConfig.sourcingRegions.join(' · ')}</dd>
              </div>
              <div className="company-address">
                <dt>Office address</dt>
                <dd>{siteConfig.addressLine1}<br />{siteConfig.city}, {siteConfig.district} District<br />{siteConfig.state} {siteConfig.pincode}</dd>
              </div>
            </dl>
            <a className="light-text-link" href="#enquire">Start a conversation <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="contact-section" id="enquire">
          <div className="contact-heading">
            <p className="eyebrow"><span /> Your next step</p>
            <h2>Let’s make<br /><em>it happen.</em></h2>
            <p className="contact-intro">Tell us a little about what you have in mind. We’ll take it from there.</p>
            <div className="contact-detail">
              <span>EMAIL US</span>
              <a href={`mailto:${siteConfig.officialEmail}`}>{siteConfig.officialEmail}</a>
              <a aria-label={`Call +91 ${siteConfig.contactNumber}`} href={`tel:+91${siteConfig.contactNumber}`}>+91 {siteConfig.contactNumber}</a>
            </div>
          </div>

          <form className="enquiry-form" onSubmit={handleEnquirySubmit}>
            <div className="form-heading"><span>01</span><h3>Send an enquiry</h3></div>
            <label>
              <span>Your name</span>
              <input autoComplete="name" name="name" placeholder="Name" required />
            </label>
            <label>
              <span>Email address</span>
              <input autoComplete="email" name="email" placeholder="you@company.com" type="email" required />
            </label>
            <label>
              <span>Phone number</span>
              <input autoComplete="tel" name="phone" placeholder="+1 555 000 0000" type="tel" required />
            </label>
            <label>
              <span>Query <small>Optional</small></span>
              <textarea ref={enquiryQueryRef} name="query" placeholder="A product, a market, a question..." rows="2" />
            </label>
            <button className="submit-button" disabled={formStatus === 'sending'} type="submit">
              {formStatus === 'sending' ? 'Sending…' : 'Submit enquiry'} <span aria-hidden="true">↗</span>
            </button>
            <p className={`form-feedback ${formStatus}`} aria-live="polite">
              {formStatus === 'sent' && 'Thank you for reaching out to us. We will get back to you soon.'}
              {formStatus === 'error' && formError}
            </p>
          </form>

          <div className={`quick-chat-widget${isQuickChatExpanded ? ' is-expanded' : ''}${isQuickChatHighlighted ? ' is-highlighted' : ''}`}>
            {isQuickChatOpen && (
              <section className="chat-panel quick-chat-popup" id="quick-chat-panel" aria-labelledby="chat-title">
                <div className="chat-heading">
                  <div className="agent-avatar" aria-hidden="true">J</div>
                  <div><h3 id="chat-title">Quick Chat</h3><p><span /> JARAMA Global Assistant</p></div>
                  <button
                    aria-label="Close Quick Chat"
                    className="chat-close-button"
                    onClick={() => {
                      setIsQuickChatOpen(false)
                      setIsQuickChatExpanded(false)
                      setIsQuickChatHighlighted(false)
                      chatLauncherRef.current?.focus()
                    }}
                    type="button"
                  >×</button>
                </div>
            {!selectedCategoryId && (
              <div className="chat-welcome">
                <p>Hello! Welcome to JARAMA Global 👋</p>
                <p>How can we help you today?</p>
                <p>Choose an option below to get quick information about our import, export, sourcing and international trade services.</p>
              </div>
            )}
            <div className="quick-chat-choices">
              {faqError && <p className="chat-disclaimer faq-error">{faqError}</p>}
              {isLoadingCategories && !selectedCategoryId && <p className="chat-disclaimer">Loading options...</p>}
              {isLoadingFaqs && <p className="chat-disclaimer">Loading options...</p>}

              {!isLoadingCategories && !faqError && (
                <label className="quick-chat-field">
                  <span>Choose a topic</span>
                  <select onChange={handleFaqCategoryChange} value={selectedCategoryId ?? ''}>
                    <option value="">Select a topic</option>
                    {faqCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
              )}

              {selectedCategoryId && selectedCategory && (
                <div className="selected-category-intro">
                  <h4>{selectedCategory.name}</h4>
                  {selectedCategory.description?.trim() && <p>{selectedCategory.description}</p>}
                </div>
              )}

              {selectedCategoryId && !isLoadingFaqs && !faqError && (
                <label className="quick-chat-field">
                  <span>Choose a question</span>
                  <select onChange={(event) => setSelectedFaqId(event.currentTarget.value)} value={selectedFaqId}>
                    <option value="">Select a question</option>
                    {categoryFaqs.map((faq) => (
                      <option key={faq.id} value={faq.id}>{faq.button_label || faq.question}</option>
                    ))}
                  </select>
                </label>
              )}

              {selectedFaq && (
                <div className="selected-faq-answer" aria-live="polite">
                  <h4>{selectedFaq.question}</h4>
                  <p>{selectedFaq.answer}</p>
                </div>
              )}

              {selectedFaq && (
                <button className="faq-home-button" onClick={handleBackToQuickChat} type="button">
                  ← Back to Quick Chat
                </button>
              )}
            </div>
            {!selectedCategoryId && (
              <form className="quick-enquiry-form" onSubmit={handleQuickEnquirySubmit}>
                <label htmlFor="quick-enquiry">Not seeing what you need?</label>
                <div>
                  <input
                    id="quick-enquiry"
                    onChange={(event) => setQuickEnquiry(event.target.value)}
                    placeholder="Tell us what you are looking for"
                    value={quickEnquiry}
                  />
                  <button disabled={isSearchingFaq || !quickEnquiry.trim()} type="submit">
                    {isSearchingFaq ? 'Searching...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
              </section>
            )}
            <button
              aria-controls="quick-chat-panel"
              aria-expanded={isQuickChatOpen}
              className="quick-chat-launcher"
              onClick={() => {
                if (isQuickChatOpen) {
                  setIsQuickChatOpen(false)
                  setIsQuickChatExpanded(false)
                  setIsQuickChatHighlighted(false)
                } else {
                  setIsQuickChatOpen(true)
                }
              }}
              ref={chatLauncherRef}
              type="button"
            >
              <span className="quick-chat-launcher-avatar" aria-hidden="true">J</span>
              <span>Quick Chat</span>
              <span aria-hidden="true">{isQuickChatOpen ? '−' : '+'}</span>
            </button>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home" aria-label={`${siteConfig.companyName}, home`}>
          <img className="brand-logo" src="/LOGO.png" alt="" />
        </a>
        <p>Good trade starts with good people.</p>
        <a href="#home">Back to top ↑</a>
      </footer>
    </>
  )
}

export default App
