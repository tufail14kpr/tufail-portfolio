'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const experiences = [
  {
    emoji: '🚀',
    period: '2025 – Present',
    title: 'Full-Stack Developer',
    company: 'TechUnique IIT — uniquebooksplus.com',
    description:
      'Currently building UniqueBooks Plus — a full-scale web application using Next.js, React.js, REST APIs, MongoDB, MS SQL, and deployed on Vercel. Responsible for complete frontend & backend architecture.',
  },
  {
    emoji: '🍽️',
    period: '2024 – 2025',
    title: 'Backend & Full-Stack Developer',
    company: 'TechUnique IIT — HRMS & Restaurant Website',
    description:
      'Developed an HRMS (Human Resource Management System) and a restaurant website using Node.js, MongoDB, and React.js. Handled REST API design, database integration, and deployment.',
  },
  {
    emoji: '⚛️',
    period: '2024',
    title: 'Frontend Developer',
    company: 'TechUnique IIT — techuniqueiit.com',
    description:
      'Started career at TechUnique IIT as a React.js developer. Built the company\'s official website (techuniqueiit.com) and progressed into Node.js & backend development.',
  },
  {
    emoji: '🎓',
    period: '2023 – 2024',
    title: 'Web Development Learner',
    company: 'Self-Taught Journey',
    description:
      'Began the web development journey with HTML5, CSS3, and JavaScript fundamentals. Built foundational projects and developed a solid understanding of core web technologies before landing the first job.',
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
