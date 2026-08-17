'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface BlogDetail {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  readTime: string;
  views: number;
  createdAt: string;
}

// Markdown parser helper for formatting rich article content
function formatMarkdown(content: string) {
  if (!content) return null;

  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const firstLineEnd = part.indexOf('\n');
      const lang = part.substring(3, firstLineEnd).trim() || 'code';
      const code = part.substring(firstLineEnd + 1, part.length - 3);
      return (
        <div key={index} style={{ position: 'relative', margin: '24px 0' }}>
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            {lang}
          </div>
          <pre>
            <code>{code}</code>
          </pre>
        </div>
      );
    }

    // Process normal markdown lines
    const lines = part.split('\n');
    return (
      <div key={index}>
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lIdx} style={{ height: '12px' }} />;

          if (trimmed.startsWith('### ')) {
            return <h3 key={lIdx}>{trimmed.replace('### ', '')}</h3>;
          }
          if (trimmed.startsWith('## ')) {
            return <h2 key={lIdx}>{trimmed.replace('## ', '')}</h2>;
          }
          if (trimmed.startsWith('# ')) {
            return <h2 key={lIdx}>{trimmed.replace('# ', '')}</h2>;
          }
          if (trimmed.startsWith('> ')) {
            return <blockquote key={lIdx}>{trimmed.replace('> ', '')}</blockquote>;
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <ul key={lIdx} style={{ margin: '4px 0 4px 24px' }}>
                <li>{trimmed.substring(2)}</li>
              </ul>
            );
          }

          // Inline formatting (bold, code)
          return (
            <p key={lIdx}>
              {line}
            </p>
          );
        })}
      </div>
    );
  });
}

export default function SingleBlogPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      const res = await fetch(`/api/blogs/${slug}`);
      const data = await res.json();
      if (data.blog) {
        setBlog(data.blog);
      }
    } catch (err) {
      console.error('Error loading article:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div className="article-container">
          {/* Back button */}
          <Link
            href="/blog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              marginBottom: '32px',
            }}
          >
            ← Back to all articles
          </Link>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>⏳</div>
              <p>Loading article...</p>
            </div>
          ) : !blog ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🔍</span>
              <h2>Article Not Found</h2>
              <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>
                The blog post you are looking for might have been removed or unpublished.
              </p>
              <Link href="/blog" className="btn-primary">
                Explore Other Articles
              </Link>
            </div>
          ) : (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Header */}
              <div className="article-header">
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {blog.tags.map((tag) => (
                    <span key={tag} className="project-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <h1 className="article-title">{blog.title}</h1>

                <div className="article-meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://avatars.githubusercontent.com/u/147920552?v=4"
                      alt="Md Tufail"
                      style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--accent-primary)' }}
                    />
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }}>Md Tufail</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Full-Stack Developer</div>
                    </div>
                  </div>

                  <span>📅 {new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span>⏱️ {blog.readTime}</span>
                  <span>👁️ {blog.views || 0} views</span>
                </div>
              </div>

              {/* Cover Image */}
              {blog.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="article-cover-img"
                />
              )}

              {/* Content Body */}
              <div className="article-content">
                {formatMarkdown(blog.content)}
              </div>

              {/* Share & Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  margin: '48px 0',
                  padding: '20px',
                  background: 'rgba(108, 99, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                }}
              >
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Liked this article? Share it with other developers!
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleCopyLink}
                    className="btn-outline"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    {copied ? '✅ Link Copied!' : '🔗 Copy Link'}
                  </button>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    🐦 Tweet
                  </a>
                </div>
              </div>

              {/* Author Bio Box */}
              <div className="glass-card" style={{ padding: '28px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://avatars.githubusercontent.com/u/147920552?v=4"
                  alt="Md Tufail"
                  style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid var(--accent-primary)' }}
                />
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Written by Md Tufail</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', marginBottom: '12px' }}>
                    Full-Stack Web Developer specializing in React, Next.js, Node.js, and MongoDB. Passionate about software architecture and modern web experiences.
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <a
                      href="https://github.com/tufail14kpr"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--accent-cyan)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                    >
                      🐙 GitHub (@tufail14kpr)
                    </a>
                    <Link
                      href="/#contact"
                      style={{ color: 'var(--accent-primary)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                    >
                      💬 Hire Me
                    </Link>
                  </div>
                </div>
              </div>
            </motion.article>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
