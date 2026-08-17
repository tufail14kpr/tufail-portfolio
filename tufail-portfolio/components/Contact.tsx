'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Something went wrong');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="section projects" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">Get In Touch</span>
          <h2 className="section-title">Contact Me</h2>
          <p className="section-description">
            Have a project in mind or want to collaborate? I&apos;d love to hear from you!
          </p>
        </motion.div>

        <div className="contact-grid">
          {/* Left: Info */}
          <motion.div
            className="contact-info"
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h3>Let&apos;s <span className="gradient-text">work together</span></h3>
            <p>
              I&apos;m always open to discussing new projects, creative ideas or opportunities
              to be part of your vision. Drop me a message and I&apos;ll get back to you soon!
            </p>

            <div className="contact-methods">
              <a
                href="https://github.com/tufail14kpr"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-method"
              >
                <div className="contact-method-icon">🐙</div>
                <div className="contact-method-info">
                  <div className="label">GitHub</div>
                  <div className="value">github.com/tufail14kpr</div>
                </div>
              </a>
              <div className="contact-method">
                <div className="contact-method-icon">📍</div>
                <div className="contact-method-info">
                  <div className="label">Location</div>
                  <div className="value">India 🇮🇳</div>
                </div>
              </div>
              <div className="contact-method">
                <div className="contact-method-icon">💼</div>
                <div className="contact-method-info">
                  <div className="label">Status</div>
                  <div className="value">✅ Available for Freelance & Full-time</div>
                </div>
              </div>
              <div className="contact-method">
                <div className="contact-method-icon">⚡</div>
                <div className="contact-method-info">
                  <div className="label">Response Time</div>
                  <div className="value">Within 24 hours</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="contact-form">
              {status === 'success' ? (
                <div className="form-success">
                  <div className="success-icon">🎉</div>
                  <h3>Message Sent!</h3>
                  <p>Thanks for reaching out! I&apos;ll get back to you within 24 hours.</p>
                  <motion.button
                    className="btn-primary"
                    onClick={() => setStatus('idle')}
                    whileHover={{ scale: 1.05 }}
                    style={{ marginTop: '16px' }}
                  >
                    Send Another Message
                  </motion.button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="name">Name</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        className="form-input"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        suppressHydrationWarning
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="email">Email</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="form-input"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        suppressHydrationWarning
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="subject">Subject</label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      className="form-input"
                      placeholder="What's this about?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      suppressHydrationWarning
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      className="form-textarea"
                      placeholder="Tell me about your project or idea..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {status === 'error' && (
                    <p style={{ color: 'var(--accent-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                      ⚠️ {errorMsg}
                    </p>
                  )}

                  <motion.button
                    type="submit"
                    className="btn-primary form-submit"
                    disabled={status === 'loading'}
                    whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    suppressHydrationWarning
                  >
                    {status === 'loading' ? '⏳ Sending...' : '🚀 Send Message'}
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
