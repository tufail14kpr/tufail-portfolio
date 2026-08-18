'use client';

import { motion, type Variants } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
  };

  return (
    <section id="about" className="section about" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeUp}
        >
          <span className="section-tag">Who I Am</span>
          <h2 className="section-title">About Me</h2>
          <p className="section-description">
            Passionate about building exceptional digital experiences from front to back.
          </p>
        </motion.div>

        <div className="about-grid">
          {/* Image */}
          <motion.div
            className="about-image-wrapper"
            initial={{ opacity: 0, x: -60 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          >
            <div className="about-decorative-box" />
            <div className="about-image-card glass-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://avatars.githubusercontent.com/u/147920552?v=4"
                alt="Md Tufail"
                style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: 'var(--border-radius)' }}
              />
              <div className="about-image-overlay" />
            </div>
            <div className="about-experience-badge">
              <div className="number">2+</div>
              <div className="label">Years of<br />Experience</div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            className="about-content"
            initial={{ opacity: 0, x: 60 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
          >
            <p className="lead">🚀 Full-Stack Web Developer</p>
            <h2>
              Turning ideas into <span className="gradient-text">digital reality</span>
            </h2>
            <p>
              I&apos;m Md Tufail, a dedicated Full-Stack Web Developer with a passion for crafting
              modern, scalable, and visually stunning web applications. I specialize in building
              complete solutions from pixel-perfect frontends to robust backend APIs.
            </p>
            <p>
              With expertise in React, Next.js, Node.js, and MongoDB, I deliver end-to-end
              solutions that combine great user experience with solid engineering. I&apos;m always
              learning new technologies and applying them to solve real-world problems.
            </p>

            <div className="about-info-grid">
              {[
                { label: 'Name', value: 'Md Tufail' },
                { label: 'GitHub', value: '@tufail14kpr' },
                { label: 'Location', value: 'India 🇮🇳' },
                { label: 'Availability', value: '✅ Open to Work' },
                { label: 'Stack', value: 'MERN + Next.js' },
                { label: 'Repos', value: '13+ Projects' },
              ].map((info) => (
                <div key={info.label} className="about-info-item">
                  <span className="about-info-label">{info.label}</span>
                  <span className="about-info-value">{info.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <motion.a
                href="https://github.com/tufail14kpr"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🐙 GitHub Profile
              </motion.a>
              <motion.a
                href="#contact"
                className="btn-outline"
                onClick={(e) => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📄 Hire Me
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
