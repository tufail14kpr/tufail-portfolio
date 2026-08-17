'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const skills = [
  { icon: '⚛️', name: 'React.js', level: 'Expert', percent: 90 },
  { icon: '▲', name: 'Next.js', level: 'Advanced', percent: 85 },
  { icon: '🟩', name: 'Node.js', level: 'Advanced', percent: 85 },
  { icon: '🍃', name: 'MongoDB', level: 'Advanced', percent: 80 },
  { icon: '🟨', name: 'JavaScript', level: 'Expert', percent: 92 },
  { icon: '🔷', name: 'TypeScript', level: 'Intermediate', percent: 70 },
  { icon: '🎨', name: 'CSS / SCSS', level: 'Expert', percent: 88 },
  { icon: '🌐', name: 'HTML5', level: 'Expert', percent: 95 },
  { icon: '🔴', name: 'Express.js', level: 'Advanced', percent: 82 },
  { icon: '🐙', name: 'Git & GitHub', level: 'Advanced', percent: 85 },
  { icon: '🔒', name: 'JWT / Auth', level: 'Advanced', percent: 78 },
  { icon: '🐳', name: 'REST APIs', level: 'Expert', percent: 88 },
];

export default function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="skills" className="section" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">What I Know</span>
          <h2 className="section-title">Skills & Technologies</h2>
          <p className="section-description">
            My toolkit for building modern full-stack applications from frontend to backend.
          </p>
        </motion.div>

        <div className="skills-grid">
          {skills.map((skill, i) => (
            <motion.div
              key={skill.name}
              className="skill-card"
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
              whileHover={{ y: -8, scale: 1.03 }}
            >
              <span className="skill-icon">{skill.icon}</span>
              <span className="skill-name">{skill.name}</span>
              <span className="skill-level">{skill.level}</span>
              <div className="skill-bar">
                <motion.div
                  className="skill-bar-fill"
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${skill.percent}%` } : { width: 0 }}
                  transition={{ duration: 1, delay: i * 0.06 + 0.3, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
