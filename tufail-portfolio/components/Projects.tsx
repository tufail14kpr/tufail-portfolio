'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const projects = [
  {
    icon: '🤖',
    title: 'AI Interviewer Web App',
    description:
      'An intelligent AI-powered interview platform that simulates real technical interviews, asks dynamic questions, and evaluates responses in real-time using modern AI techniques.',
    tags: ['JavaScript', 'React', 'Node.js', 'AI/ML'],
    github: 'https://github.com/tufail14kpr/AI-interviewer-web-app',
    live: null,
    language: 'JavaScript',
    stars: 0,
  },
  {
    icon: '👥',
    title: 'Employee Management System',
    description:
      'A comprehensive full-stack employee management system with JWT authentication, CRUD operations, role-based access control, and MongoDB database.',
    tags: ['Node.js', 'MongoDB', 'JWT', 'Express.js'],
    github: 'https://github.com/tufail14kpr/Employee-management',
    live: null,
    language: 'JavaScript',
    stars: 0,
  },
  {
    icon: '📝',
    title: 'Next.js CRUD App with Auth',
    description:
      'A feature-rich CRUD application built with Next.js and React, featuring complete authentication system, protected routes, and modern UI design.',
    tags: ['Next.js', 'React', 'CSS', 'Authentication'],
    github: 'https://github.com/tufail14kpr/Next.js-React-CRUD-App-with-Auth-',
    live: null,
    language: 'CSS',
    stars: 0,
  },
  {
    icon: '📡',
    title: 'Blog Node.js Microservices',
    description:
      'A blog platform built using a mini-microservices architecture with Node.js. Each service handles specific functionality for scalability and maintainability.',
    tags: ['Node.js', 'Microservices', 'JavaScript', 'REST API'],
    github: 'https://github.com/tufail14kpr/blog_node_js_proj_mini-microservies',
    live: null,
    language: 'JavaScript',
    stars: 0,
  },
  {
    icon: '📋',
    title: 'Employee Information Form',
    description:
      'A dynamic employee information management form with validation, data persistence, and interactive UI built with modern JavaScript and React patterns.',
    tags: ['React', 'JavaScript', 'Forms', 'Validation'],
    github: 'https://github.com/tufail14kpr/employee-information-form',
    live: null,
    language: 'JavaScript',
    stars: 0,
  },
  {
    icon: '🌐',
    title: 'HTML5 2025 Revision',
    description:
      'A comprehensive HTML5 revision project showcasing modern semantic HTML practices, accessibility standards, and advanced layout techniques. 1 star on GitHub!',
    tags: ['HTML5', 'CSS3', 'Semantic Web', 'A11y'],
    github: 'https://github.com/tufail14kpr/HTML2025-revision',
    live: null,
    language: 'HTML',
    stars: 1,
  },
];

const langColors: Record<string, string> = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  CSS: '#264de4',
  HTML: '#e34f26',
  Python: '#3776ab',
};

export default function Projects() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="projects" className="section projects" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">My Work</span>
          <h2 className="section-title">Featured Projects</h2>
          <p className="section-description">
            A showcase of my real GitHub projects — from AI applications to full-stack MERN apps.
          </p>
        </motion.div>

        <div className="projects-grid">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              className="project-card"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
              whileHover={{ y: -6 }}
            >
              <div className="project-header">
                <span className="project-icon">{project.icon}</span>
                <div className="project-links">
                  <motion.a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                    title="GitHub Repository"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    🐙
                  </motion.a>
                  {project.live && (
                    <motion.a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                      title="Live Demo"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      🔗
                    </motion.a>
                  )}
                </div>
              </div>

              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>

              <div className="project-tags">
                {project.tags.map((tag) => (
                  <span key={tag} className="project-tag">{tag}</span>
                ))}
              </div>

              <div className="project-meta">
                <div className="project-meta-item">
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: langColors[project.language] || '#ccc',
                    display: 'inline-block',
                  }} />
                  {project.language}
                </div>
                <div className="project-meta-item">
                  ⭐ {project.stars}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          style={{ textAlign: 'center', marginTop: '50px' }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <motion.a
            href="https://github.com/tufail14kpr?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🐙 View All 13+ Repositories on GitHub
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
