'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';

interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  readTime: string;
  createdAt: string;
}

export default function BlogSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [blogs, setBlogs] = useState<BlogItem[]>([]);

  useEffect(() => {
    fetch('/api/blogs')
      .then((res) => res.json())
      .then((data) => {
        if (data.blogs) setBlogs(data.blogs.slice(0, 3));
      })
      .catch((err) => console.error(err));
  }, []);

  if (blogs.length === 0) return null;

  return (
    <section id="blog" className="section" ref={ref} style={{ background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%)' }}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">Latest Writing</span>
          <h2 className="section-title">Articles & Guides</h2>
          <p className="section-description">
            Practical development guides, engineering notes, and best practices.
          </p>
        </motion.div>

        <div className="blog-grid">
          {blogs.map((blog, i) => (
            <motion.article
              key={blog._id}
              className="blog-card"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {blog.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="blog-card-img"
                />
              ) : (
                <div className="blog-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                  🚀
                </div>
              )}

              <div className="blog-card-body">
                <div className="blog-card-meta">
                  <span>📅 {new Date(blog.createdAt).toLocaleDateString()}</span>
                  <span>⏱️ {blog.readTime}</span>
                </div>

                <Link href={`/blog/${blog.slug}`}>
                  <h3 className="blog-card-title">{blog.title}</h3>
                </Link>

                <p className="blog-card-excerpt">{blog.excerpt}</p>

                <div className="blog-card-footer">
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {blog.tags.slice(0, 2).map((t) => (
                      <span key={t} className="project-tag" style={{ fontSize: '11px' }}>
                        {t}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/blog/${blog.slug}`}
                    style={{
                      color: 'var(--accent-cyan)',
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Read →
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link href="/blog" className="btn-outline">
            📚 View All Articles
          </Link>
        </div>
      </div>
    </section>
  );
}
