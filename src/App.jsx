import { useState } from 'react'
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

const questions = [
  {
    question: 'What does JARAMA Global do?',
    terms: ['what', 'do', 'services', 'jara', 'company'],
    answer:
      'JARAMA Global supports businesses with import and export sourcing, supplier coordination, and practical trade support. Tell us what you are looking to move and our team can discuss the right next step.',
  },
  {
    question: 'Can you help with importing products?',
    terms: ['import', 'bring', 'source', 'supplier'],
    answer:
      'We can help you explore product sourcing and import coordination. Share the product, origin or destination market, and approximate volume in the enquiry form so the team has a useful starting point.',
  },
  {
    question: 'Do you support exports?',
    terms: ['export', 'sell', 'overseas', 'international'],
    answer:
      'Yes, export sourcing and coordination are part of our draft service offering. The exact route depends on your product and target market, so send us a few details and we can take it from there.',
  },
  {
    question: 'How do I request a quote?',
    terms: ['quote', 'price', 'cost', 'estimate'],
    answer:
      'Use the enquiry form with your name, email, phone number, and a note about the product or route you have in mind. We can follow up to understand the requirements before preparing a quote.',
  },
  {
    question: 'Which markets do you cover?',
    terms: ['market', 'country', 'where', 'location', 'ship'],
    answer:
      'Market coverage is being finalized. Please include your origin and destination countries in the enquiry and the JARAMA team can confirm what is currently available.',
  },
]

function findAnswer(message) {
  const normalized = message.toLowerCase()
  const match = questions.find(({ terms }) => terms.some((term) => normalized.includes(term)))
  return (
    match?.answer ??
    'I do not have that detail yet. Leave your question and contact information in the enquiry form, and the JARAMA team can follow up with a more specific answer.'
  )
}

function App() {
  const [activeMenu, setActiveMenu] = useState(null)
  const [formStatus, setFormStatus] = useState('idle')
  const [formError, setFormError] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    {
      from: 'agent',
      text: `Hello, I am the JARAMA guide. Ask me about ${siteConfig.companyName} or choose a question below.`,
    },
  ])

  async function handleEnquirySubmit(event) {
    event.preventDefault()
    if (!siteConfig.enquiryEndpoint) {
      setFormStatus('unconfigured')
      setFormError('This front-end build is not connected to a live enquiry API yet.')
      return
    }

    setFormStatus('sending')
    setFormError('')
    const formElement = event.currentTarget
    const formData = new FormData(formElement)

    try {
      const response = await fetch(siteConfig.enquiryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      })
      if (!response.ok) {
        const errorResponse = await response.json().catch(() => null)
        throw new Error(errorResponse?.message || 'The enquiry could not be delivered.')
      }
      formElement.reset()
      setFormStatus('sent')
    } catch (error) {
      setFormStatus('error')
      setFormError(
        error instanceof TypeError
          ? 'The enquiry service is offline or not configured for this front-end build.'
          : error.message,
      )
    }
  }

  function sendChatMessage(message = chatInput) {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    setChatMessages((currentMessages) => [
      ...currentMessages,
      { from: 'visitor', text: trimmedMessage },
      { from: 'agent', text: findAnswer(trimmedMessage) },
    ])
    setChatInput('')
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
          <a className="nav-enquire" href="#enquire">Let’s talk <span aria-hidden="true">↗</span></a>
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
              <p className="eyebrow"><span /> What we do</p>
              <h2>Trade support,<br /><em>thought through.</em></h2>
            </div>
            <p className="section-summary">From the first supplier conversation to the final handoff, we help make international trade feel more manageable.</p>
          </div>
          <div className="service-list">
            {siteConfig.services.map((service, index) => (
              <article className="service-row" key={service.title}>
                <span className="service-number">0{index + 1}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <a href="#enquire" aria-label={`Ask us about ${service.title}`}>↗</a>
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
              <span>OFFICIAL ENQUIRIES</span>
              <a href={`mailto:${siteConfig.officialEmail}`}>{siteConfig.officialEmail}</a>
              <a aria-label={`Call ${siteConfig.contactNumber}`} href={`tel:${siteConfig.contactNumber}`}>{siteConfig.contactNumber}</a>
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
              <span>What are you looking to do? <small>Optional</small></span>
              <textarea name="message" placeholder="A product, a market, a question..." rows="2" />
            </label>
            <button className="submit-button" disabled={formStatus === 'sending'} type="submit">
              {formStatus === 'sending' ? 'Sending…' : 'Submit enquiry'} <span aria-hidden="true">↗</span>
            </button>
            <p className={`form-feedback ${formStatus}`} aria-live="polite">
              {formStatus === 'unconfigured' && 'Online delivery is not connected yet. Please contact JARAMA directly once the official email is added.'}
              {formStatus === 'sent' && 'Your enquiry has been sent. Thank you for reaching out.'}
              {formStatus === 'error' && formError}
            </p>
          </form>

          <section className="chat-panel" aria-labelledby="chat-title">
            <div className="chat-heading">
              <div className="agent-avatar" aria-hidden="true">J</div>
              <div><h3 id="chat-title">JARAMA guide</h3><p><span /> Here to help</p></div>
              <span className="chat-label">QUICK CHAT</span>
            </div>
            <div className="chat-messages" aria-live="polite" aria-relevant="additions">
              {chatMessages.map((message, index) => (
                <p className={`chat-message ${message.from}`} key={`${message.from}-${index}`}>{message.text}</p>
              ))}
            </div>
            <div className="suggested-questions" aria-label="Suggested questions">
              {questions.slice(0, 3).map(({ question }) => (
                <button key={question} onClick={() => sendChatMessage(question)} type="button">{question}</button>
              ))}
            </div>
            <form className="chat-input-row" onSubmit={(event) => { event.preventDefault(); sendChatMessage() }}>
              <label className="sr-only" htmlFor="chat-input">Ask the JARAMA guide</label>
              <input id="chat-input" onChange={(event) => setChatInput(event.target.value)} placeholder="Write a message..." value={chatInput} />
              <button aria-label="Send message" type="submit">↗</button>
            </form>
            <p className="chat-disclaimer">Automated answers · For specific advice, send an enquiry</p>
          </section>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home" aria-label={`${siteConfig.companyName}, home`}>
          <img className="brand-logo" src="/LOGO.png" alt="" />
        </a>
        <p>Good trade starts with good people.</p>
        <span>{siteConfig.publicSiteDomain || 'Website domain to be added'}</span>
        <a href="#home">Back to top ↑</a>
      </footer>
    </>
  )
}

export default App
