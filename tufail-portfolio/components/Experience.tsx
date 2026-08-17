'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const experiences = [
  {
    emoji: '💻',
    period: '2024 – Present',
    title: 'Full-Stack Developer',
    company: 'Freelance / Self-Employed',
    description:
      'Building complete web applications using React, Next.js, Node.js, and MongoDB. Developed AI-powered tools, employee management systems, and microservices architectures for various clients.',
  },
  {
    emoji: '⚛️',
    period: '2025 – 2026',
    title: 'React & Next.js Specialist',
    company: 'Personal Projects & Learning',
    description:
      'Deep-dived into modern React patterns, Next.js App Router, server-side rendering, and TypeScript. Built production-grade CRUD apps with authentication and complex state management.',
  },
  {
    emoji: '🟩',
    period: '2024 – 2025',
    title: 'Backend Developer',
    company: 'Node.js + MongoDB Projects',
    description:
      'Developed robust REST APIs with Node.js and Express. Implemented JWT authentication, built microservices architectures, and worked with MongoDB for data persistence.',
  },
  {
    emoji: '🎓',
    period: '2023 – 2024',
    title: 'Web Development Learner',
    company: 'Self-Taught Journey',
    description:
      'Started the web development journey learning HTML5, CSS3, and JavaScript fundamentals. Built foundational projects and developed a strong understanding of core web technologies.',
  },
];

export default function Experience() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="experience" className="section" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">My Journey</span>
          <h2 className="section-title">Experience & Learning</h2>
          <p className="section-description">
            My professional journey and the milestones that shaped me as a developer.
          </p>
        </motion.div>

        <div className="timeline">
          {experiences.map((exp, i) => (
            <motion.div
              key={exp.title}
              className="timeline-item"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15, ease: 'easeOut' }}
            >
              {/* Odd items: content left, dot center */}
              {i % 2 === 0 ? (
                <>
                  <motion.div
                    className="timeline-content"
                    style={{ gridColumn: 1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="timeline-period">{exp.period}</div>
                    <h3 className="timeline-title">{exp.title}</h3>
                    <div className="timeline-company">{exp.company}</div>
                    <p className="timeline-desc">{exp.description}</p>
                  </motion.div>
                  <div className="timeline-dot" style={{ gridColumn: 2 }}>{exp.emoji}</div>
                  <div style={{ gridColumn: 3 }} />
                </>
              ) : (
                <>
                  <div style={{ gridColumn: 1 }} />
                  <div className="timeline-dot" style={{ gridColumn: 2 }}>{exp.emoji}</div>
                  <motion.div
                    className="timeline-content"
                    style={{ gridColumn: 3 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="timeline-period">{exp.period}</div>
                    <h3 className="timeline-title">{exp.title}</h3>
                    <div className="timeline-company">{exp.company}</div>
                    <p className="timeline-desc">{exp.description}</p>
                  </motion.div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
