'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  readTime: string;
  published: boolean;
  views: number;
  createdAt: string;
}

interface MessageItem {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminPage() {
  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Tab state: 'overview' | 'blogs' | 'editor' | 'messages'
  const [activeTab, setActiveTab] = useState<'overview' | 'blogs' | 'editor' | 'messages'>('overview');

  // Data states
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editor form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    tags: '',
    published: true,
  });

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Authenticated fetch wrapper with automatic token refresh on 401
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    let res = await fetch(url, {
      ...options,
      headers: defaultHeaders,
      credentials: 'include', // Sends HttpOnly Cookies automatically
    });

    // If access token is expired, attempt seamless refresh
    if (res.status === 401) {
      const refreshRes = await fetch('/api/admin/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshRes.ok) {
        // Retry the original request with new cookie
        res = await fetch(url, {
          ...options,
          headers: defaultHeaders,
          credentials: 'include',
        });
      } else {
        setIsAuthenticated(false);
        setAdminUser(null);
      }
    }

    return res;
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      // 1. Load blogs
      const blogsRes = await fetchWithAuth('/api/blogs?all=true');
      if (blogsRes.ok) {
        const blogsData = await blogsRes.json();
        if (blogsData.blogs) setBlogs(blogsData.blogs);
      }

      // 2. Load contact messages
      const msgRes = await fetchWithAuth('/api/admin/messages');
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        if (msgData.messages) setMessages(msgData.messages);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }, [fetchWithAuth]);

  // Check active session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setAdminUser(data.user);
            setIsAuthenticated(true);
            loadDashboardData();
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, [loadDashboardData]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setAdminUser(data.user);
        setIsAuthenticated(true);
        loadDashboardData();
        showNotification('success', `Welcome back, ${data.user.name}!`);
      } else {
        setLoginError(data.error || 'Invalid email or password');
      }
    } catch {
      setLoginError('Authentication server connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuthenticated(false);
      setAdminUser(null);
      setEmail('');
      setPassword('');
      showNotification('success', 'Logged out successfully');
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const autoSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingId ? prev.slug : autoSlug,
    }));
  };

  const startNewBlog = () => {
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '## Introduction\n\nWrite your blog post here in Markdown...\n\n```javascript\nconsole.log("Hello, World!");\n```',
      coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop',
      tags: 'React, Next.js, WebDev',
      published: true,
    });
    setActiveTab('editor');
  };

  const startEditBlog = (blog: BlogItem) => {
    setEditingId(blog._id);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      coverImage: blog.coverImage || '',
      tags: blog.tags.join(', '),
      published: blog.published,
    });
    setActiveTab('editor');
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      showNotification('error', 'Title and Content are required!');
      return;
    }

    setLoading(true);
    try {
      const url = editingId ? `/api/blogs/${editingId}` : '/api/blogs';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', editingId ? 'Blog updated successfully!' : 'Blog created successfully!');
        loadDashboardData();
        setActiveTab('blogs');
      } else {
        showNotification('error', data.error || 'Failed to save blog');
      }
    } catch {
      showNotification('error', 'Network error while saving blog');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetchWithAuth(`/api/blogs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Blog deleted successfully');
        loadDashboardData();
      } else {
        showNotification('error', 'Failed to delete blog');
      }
    } catch {
      showNotification('error', 'Network error while deleting');
    }
  };

  const handleTogglePublish = async (blog: BlogItem) => {
    try {
      const res = await fetchWithAuth(`/api/blogs/${blog._id}`, {
        method: 'PUT',
        body: JSON.stringify({ published: !blog.published }),
      });
      if (res.ok) {
        showNotification('success', `Blog ${!blog.published ? 'Published' : 'Moved to Draft'}`);
        loadDashboardData();
      }
    } catch {
      showNotification('error', 'Could not toggle status');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      const res = await fetchWithAuth(`/api/admin/messages?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Message deleted');
        loadDashboardData();
      }
    } catch {
      showNotification('error', 'Failed to delete message');
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end) || 'text';
    const replacement = `${prefix}${selected}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setFormData((prev) => ({ ...prev, content: newText }));
  };

  // Loading spinner while checking cookie session
  if (authChecking) {
    return (
      <>
        <Navbar />
        <main className="admin-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛡️</div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>Verifying secure admin session...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Render Login View if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <main className="admin-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <motion.div
            className="glass-card"
            style={{ width: '100%', maxWidth: '460px', padding: '44px 36px' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span style={{ fontSize: '44px', display: 'block', marginBottom: '12px' }}>🔐</span>
              <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>Admin Dashboard</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                HttpOnly Secure Cookie Session & Role-Based Access Control
              </p>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" htmlFor="adminEmail">Admin Email</label>
                <input
                  id="adminEmail"
                  type="email"
                  className="form-input"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" htmlFor="adminPassword">Password</label>
                <input
                  id="adminPassword"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {loginError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 101, 132, 0.15)', border: '1px solid rgba(255, 101, 132, 0.3)', color: '#ff6584', fontSize: '13px', marginBottom: '16px' }}>
                  ⚠️ {loginError}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                disabled={loading}
              >
                {loading ? 'Verifying Credentials...' : '⚡ Login to Dashboard'}
              </button>
            </form>
          </motion.div>
        </main>
        <Footer />
      </>
    );
  }

  // Calculate stats
  const publishedCount = blogs.filter((b) => b.published).length;
  const draftCount = blogs.length - publishedCount;
  const totalViews = blogs.reduce((acc, curr) => acc + (curr.views || 0), 0);

  return (
    <>
      <Navbar />
      <main className="admin-wrapper">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="section-tag" style={{ margin: 0 }}>
                  🛡️ {adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ({adminUser?.email})
                </span>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 700 }}>
                Welcome, <span className="gradient-text">{adminUser?.name || 'Md Tufail'}</span>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                className="btn-primary"
                onClick={startNewBlog}
                style={{ padding: '10px 20px', fontSize: '14px' }}
              >
                ✍️ Write New Blog
              </button>
              <button
                className="btn-outline"
                onClick={handleLogout}
                style={{ padding: '9px 18px', fontSize: '13px' }}
              >
                🚪 Logout
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  background: notification.type === 'success' ? 'rgba(67, 233, 123, 0.2)' : 'rgba(255, 101, 132, 0.2)',
                  border: `1px solid ${notification.type === 'success' ? 'rgba(67, 233, 123, 0.4)' : 'rgba(255, 101, 132, 0.4)'}`,
                  color: notification.type === 'success' ? '#43e97b' : '#ff6584',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                }}
              >
                {notification.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Tabs */}
          <div className="admin-tabs">
            <button
              className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'blogs' ? 'active' : ''}`}
              onClick={() => setActiveTab('blogs')}
            >
              📝 Manage Blogs ({blogs.length})
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              {editingId ? '✏️ Edit Blog' : '➕ Create Blog'}
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              📬 Messages ({messages.length})
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon">📚</div>
                  <div>
                    <div className="admin-stat-val">{blogs.length}</div>
                    <div className="admin-stat-lbl">Total Blogs</div>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon">🟢</div>
                  <div>
                    <div className="admin-stat-val">{publishedCount}</div>
                    <div className="admin-stat-lbl">Published</div>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon">⏳</div>
                  <div>
                    <div className="admin-stat-val">{draftCount}</div>
                    <div className="admin-stat-lbl">Drafts</div>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon">📬</div>
                  <div>
                    <div className="admin-stat-val">{messages.length}</div>
                    <div className="admin-stat-lbl">Contact Inquiries</div>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon">👁️</div>
                  <div>
                    <div className="admin-stat-val">{totalViews}</div>
                    <div className="admin-stat-lbl">Total Views</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="glass-card" style={{ padding: '28px', marginBottom: '30px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '18px' }}>Recent Articles</h3>
                {blogs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No blogs uploaded yet. Click &quot;Write New Blog&quot; to publish your first post!</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Read Time</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogs.slice(0, 5).map((blog) => (
                        <tr key={blog._id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{blog.title}</td>
                          <td>
                            <span className={`badge ${blog.published ? 'badge-success' : 'badge-draft'}`}>
                              {blog.published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td>{blog.readTime}</td>
                          <td>{new Date(blog.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              onClick={() => startEditBlog(blog)}
                              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', marginRight: '12px' }}
                            >
                              Edit
                            </button>
                            <a
                              href={`/blog/${blog.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--accent-primary)', fontSize: '13px' }}
                            >
                              View ↗
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE BLOGS */}
          {activeTab === 'blogs' && (
            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px' }}>All Articles ({blogs.length})</h3>
                <button className="btn-primary" onClick={startNewBlog} style={{ padding: '8px 18px', fontSize: '13px' }}>
                  + New Blog
                </button>
              </div>

              {blogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No blogs found.</p>
                  <button className="btn-primary" onClick={startNewBlog}>Write First Blog</button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Cover</th>
                        <th>Title & Slug</th>
                        <th>Tags</th>
                        <th>Views</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogs.map((blog) => (
                        <tr key={blog._id}>
                          <td style={{ width: '60px' }}>
                            {blog.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={blog.coverImage}
                                alt={blog.title}
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                              />
                            ) : (
                              <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                📄
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                              {blog.title}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              /{blog.slug}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {blog.tags.map((t) => (
                                <span key={t} className="project-tag" style={{ fontSize: '10px', padding: '2px 8px' }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>👁️ {blog.views || 0}</td>
                          <td>
                            <button
                              onClick={() => handleTogglePublish(blog)}
                              className={`badge ${blog.published ? 'badge-success' : 'badge-draft'}`}
                              style={{ cursor: 'pointer', border: 'none' }}
                              title="Click to toggle publish status"
                            >
                              {blog.published ? 'Published' : 'Draft'}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                onClick={() => startEditBlog(blog)}
                                className="btn-outline"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                Edit
                              </button>
                              <a
                                href={`/blog/${blog.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-outline"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                View
                              </a>
                              <button
                                onClick={() => handleDeleteBlog(blog._id, blog.title)}
                                style={{
                                  padding: '6px 10px',
                                  fontSize: '12px',
                                  background: 'rgba(255, 101, 132, 0.1)',
                                  border: '1px solid rgba(255, 101, 132, 0.3)',
                                  color: '#ff6584',
                                  borderRadius: '50px',
                                  cursor: 'pointer',
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CREATE / EDIT BLOG EDITOR */}
          {activeTab === 'editor' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px' }}>
                  {editingId ? '✏️ Edit Blog Article' : '➕ Write New Article'}
                </h3>
                {editingId && (
                  <button
                    onClick={startNewBlog}
                    className="btn-outline"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    Cancel & New
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveBlog}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="blogTitle">Blog Title *</label>
                    <input
                      id="blogTitle"
                      type="text"
                      className="form-input"
                      placeholder="e.g. How to Build Scalable Microservices with Node.js"
                      value={formData.title}
                      onChange={handleTitleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="blogSlug">URL Slug</label>
                    <input
                      id="blogSlug"
                      type="text"
                      className="form-input"
                      placeholder="auto-generated-slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="blogCover">Cover Image URL</label>
                    <input
                      id="blogCover"
                      type="url"
                      className="form-input"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.coverImage}
                      onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="blogTags">Tags (comma separated)</label>
                    <input
                      id="blogTags"
                      type="text"
                      className="form-input"
                      placeholder="React, Next.js, Architecture"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="blogExcerpt">Short Summary / Excerpt *</label>
                  <input
                    id="blogExcerpt"
                    type="text"
                    className="form-input"
                    placeholder="Brief 1-2 sentence description shown in blog previews"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    required
                  />
                </div>

                {/* Formatting Toolbar */}
                <div style={{ marginBottom: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                  <button type="button" onClick={() => insertFormatting('## ')} className="btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>H2</button>
                  <button type="button" onClick={() => insertFormatting('### ')} className="btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>H3</button>
                  <button type="button" onClick={() => insertFormatting('**', '**')} className="btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>Bold</button>
                  <button type="button" onClick={() => insertFormatting('*', '*')} className="btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>Italic</button>
                  <button type="button" onClick={() => insertFormatting('`', '`')} className="btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>Code</button>
                  <button type="button" onClick={() => insertFormatting('```javascript\n', '\n```')} className="btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>Code Block</button>
                  <button type="button" onClick={() => insertFormatting('> ')} className="btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>Quote</button>
                  <button type="button" onClick={() => insertFormatting('- ')} className="btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>List</button>
                </div>

                {/* Editor Grid: Left Textarea, Right Preview */}
                <div className="admin-editor-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="content-editor">Markdown Content *</label>
                    <textarea
                      id="content-editor"
                      className="form-textarea"
                      style={{ height: '480px', fontFamily: 'var(--font-mono)', fontSize: '14px', lineHeight: '1.6' }}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write your article in Markdown..."
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Live Preview</label>
                    <div className="markdown-preview article-content">
                      <h2>{formData.title || 'Untitled Article'}</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {formData.excerpt}
                      </p>
                      <hr style={{ borderColor: 'var(--border-color)', margin: '16px 0' }} />
                      <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {formData.content}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                    />
                    Publish immediately (publicly visible)
                  </label>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    style={{ padding: '12px 32px' }}
                  >
                    {loading ? 'Saving...' : editingId ? '💾 Update Blog' : '🚀 Publish Article'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: CONTACT INQUIRIES */}
          {activeTab === 'messages' && (
            <div className="glass-card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>
                Contact Inquiries ({messages.length})
              </h3>

              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No messages received yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--border-radius-sm)',
                        padding: '20px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
                            {msg.name}
                          </span>{' '}
                          <a
                            href={`mailto:${msg.email}`}
                            style={{ color: 'var(--accent-cyan)', fontSize: '13px', marginLeft: '8px' }}
                          >
                            ({msg.email})
                          </a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ff6584',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                            title="Delete inquiry"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '8px', fontSize: '14px' }}>
                        Subject: {msg.subject}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
