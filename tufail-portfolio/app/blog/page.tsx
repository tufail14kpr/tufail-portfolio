'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  readTime: string;
  views: number;
  createdAt: string;
}

export default function BlogArchivePage() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/blogs');
      const data = await res.json();
      if (data.blogs) {
        setBlogs(data.blogs);
      }
    } catch (err) {
      console.error('Error loading blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Collect unique tags
  const allTags = ['All', ...Array.from(new Set(blogs.flatMap((b) => b.tags || [])))];

  // Filtered blogs
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag === 'All' || blog.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <>
      <Navbar />
      <main className="section" style={{ minHeight: '100vh', paddingTop: '120px' }}>
        <div className="container">
          {/* Header */}
          <div className="blog-header">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="section-tag">Articles & Insights</span>
              <h1 className="section-title">
                Technical <span className="gradient-text">Blog</span>
              </h1>
              <p className="section-description">
                Thoughts, tutorials, and practical insights on Full-Stack Development, React, Next.js, Node.js, and Modern Architecture.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              className="blog-search-bar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <input
                type="text"
                className="form-input"
                placeholder="Search articles by title, topic or tech..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ borderRadius: '50px', padding: '14px 24px' }}
              />
            </motion.div>

            {/* Tags Filter */}
            {allTags.length > 1 && (
              <motion.div
                style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '20px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={selectedTag === tag ? 'badge badge-success' : 'badge'}
                    style={{
                      cursor: 'pointer',
                      border: selectedTag === tag ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: selectedTag === tag ? 'var(--gradient-primary)' : 'rgba(10, 15, 46, 0.5)',
                      color: selectedTag === tag ? '#fff' : 'var(--text-secondary)',
                      padding: '6px 14px',
                      fontSize: '12px',
                      transition: 'var(--transition)',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Blog Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <p>Loading articles from MongoDB Atlas...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📝</span>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No articles found</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                {searchQuery || selectedTag !== 'All'
                  ? 'Try changing your search keywords or tag filters.'
                  : 'Be the first to publish a blog using the admin panel!'}
              </p>
              <Link href="/admin" className="btn-primary">
                ✍️ Write in Admin Panel
              </Link>
            </div>
          ) : (
            <div className="blog-grid">
              {filteredBlogs.map((blog, i) => (
                <motion.article
                  key={blog._id}
                  className="blog-card"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
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
                    <div
                      className="blog-card-img"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                      }}
                    >
                      🚀
                    </div>
                  )}

                  <div className="blog-card-body">
                    <div className="blog-card-meta">
                      <span>📅 {new Date(blog.createdAt).toLocaleDateString()}</span>
                      <span>⏱️ {blog.readTime}</span>
                      <span>👁️ {blog.views || 0}</span>
                    </div>

                    <Link href={`/blog/${blog.slug}`}>
                      <h2 className="blog-card-title">{blog.title}</h2>
                    </Link>

                    <p className="blog-card-excerpt">{blog.excerpt}</p>

                    <div className="blog-card-footer">
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        Read Post →
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
