'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import dynamic from 'next/dynamic';

const Scene = dynamic(() => import('./Scene'), { ssr: false });

const roles = [
  'Full-Stack Developer',
  'React & Next.js Expert',
  'Node.js Developer',
  'MongoDB Specialist',
  'API Architect',
];

export default function Hero() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentRole = roles[roleIndex];
    if (!isDeleting) {
      if (displayedText.length < currentRole.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayedText(currentRole.slice(0, displayedText.length + 1));
        }, 80);
      } else {
        timeoutRef.current = setTimeout(() => setIsDeleting(true), 2500);
      }
    } else {
      if (displayedText.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, 40);
      } else {
        setIsDeleting(false);
        setRoleIndex((prev) => (prev + 1) % roles.length);
      }
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [displayedText, isDeleting, roleIndex]);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <section id="home" className="hero">
      <div className="hero-canvas">
        <Scene />
      </div>

      <div className="container" style={{ width: '100%' }}>
        <div className="hero-content">
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item}>
              <div className="hero-badge">
                <span className="dot" />
                Available for Work
              </div>
            </motion.div>

            <motion.h1 className="hero-title" variants={item}>
              Hi, I&apos;m
              <span className="hero-name">Md Tufail</span>
            </motion.h1>

            <motion.div className="hero-role" variants={item}>
              <span style={{ color: 'var(--accent-cyan)' }}>&gt;</span>
              {displayedText}
              <span className="cursor" />
            </motion.div>

            <motion.p className="hero-description" variants={item}>
              A passionate Full-Stack Web Developer from India, crafting modern and scalable
              web applications using React, Next.js, Node.js, and MongoDB. I turn ideas into
              stunning digital experiences.
            </motion.p>

            <motion.div className="hero-buttons" variants={item}>
              <motion.a
                href="#projects"
                className="btn-primary"
                onClick={(e) => { e.preventDefault(); document.querySelector('#projects')?.scrollIntoView({ behavior: 'smooth' }); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🚀 View Projects
              </motion.a>
              <motion.a
                href="#contact"
                className="btn-outline"
                onClick={(e) => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                💬 Contact Me
              </motion.a>
            </motion.div>

            <motion.div className="hero-stats" variants={item}>
              {[
                { number: '13+', label: 'Projects' },
                { number: '2+', label: 'Years Exp' },
                { number: '100%', label: 'Dedication' },
              ].map((stat) => (
                <div key={stat.label} className="hero-stat">
                  <div className="hero-stat-number">{stat.number}</div>
                  <div className="hero-stat-label">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right side - Avatar */}
          <motion.div
            className="hero-right"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
          >
            <div className="hero-avatar-wrapper">
              <div className="hero-avatar-ring" />
              <div className="hero-avatar-ring-2" />
              <div className="hero-avatar-glow" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="hero-avatar-img"
                src="https://avatars.githubusercontent.com/u/147920552?v=4"
                alt="Md Tufail"
              />
              <div className="hero-tech-float">⚛️ React.js</div>
              <div className="hero-tech-float">🟩 Node.js</div>
              <div className="hero-tech-float">🍃 MongoDB</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          zIndex: 2,
        }}
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        onClick={() => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}>SCROLL</span>
        <div style={{ width: '24px', height: '40px', border: '2px solid var(--border-color)', borderRadius: '12px', display: 'flex', justifyContent: 'center', paddingTop: '6px' }}>
          <motion.div
            style={{ width: '4px', height: '8px', background: 'var(--accent-primary)', borderRadius: '2px' }}
            animate={{ y: [0, 14, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </div>
      </motion.div>
    </section>
  );
}
