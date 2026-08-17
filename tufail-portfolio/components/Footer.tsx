'use client';

import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <motion.span
          className="footer-logo"
          whileHover={{ scale: 1.05 }}
        >
          &lt;Tufail /&gt;
        </motion.span>

        <p className="footer-copy">
          © {currentYear} Md Tufail. Built with ❤️ using Next.js & Three.js
        </p>

        <div className="footer-socials">
          <motion.a
            href="https://github.com/tufail14kpr"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social"
            title="GitHub"
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.9 }}
          >
            🐙
          </motion.a>
          <motion.a
            href="#home"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="footer-social"
            title="Back to top"
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.9 }}
          >
            ↑
          </motion.a>
        </div>
      </div>
    </footer>
  );
}
