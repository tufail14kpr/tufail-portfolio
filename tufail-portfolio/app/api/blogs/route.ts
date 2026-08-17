import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { authenticateAdmin, applySecurityHeaders } from '@/lib/auth';

function calculateReadTime(text: string): string {
  const wordsPerMinute = 200;
  const words = text ? text.trim().split(/\s+/).length : 0;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${Math.max(1, minutes)} min read`;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/blogs - Fetch published blogs (or all drafts if authenticated as admin)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';
    const tag = searchParams.get('tag');
    const query = searchParams.get('q');

    const authResult = await authenticateAdmin(request);
    const filter: Record<string, any> = {};

    // Only allow viewing unpublished drafts if authenticated as admin
    if (showAll && authResult.authenticated) {
      // no published constraint - admin sees all drafts
    } else {
      filter.published = true;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { excerpt: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ];
    }

    const blogs = await Blog.find(filter).sort({ createdAt: -1 });

    const response = NextResponse.json({ success: true, blogs }, { status: 200 });
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('[FETCH_BLOGS_ERROR]', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch blogs', code: 'SERVER_ERROR' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}

// POST /api/blogs - Create new blog (Protected via authenticateAdmin)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.authenticated) {
      return (
        authResult.errorResponse ||
        applySecurityHeaders(
          NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
        )
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Invalid JSON payload', code: 'INVALID_PAYLOAD' }, { status: 400 })
      );
    }

    const { title, slug, excerpt, content, coverImage, tags, published } = body || {};

    if (!title || !content) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Title and content are required', code: 'MISSING_FIELDS' },
          { status: 400 }
        )
      );
    }

    await connectDB();

    let finalSlug = slug ? generateSlug(slug) : generateSlug(title);

    // Check if slug exists, if so append unique timestamp
    const existingBlog = await Blog.findOne({ slug: finalSlug });
    if (existingBlog) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const readTime = calculateReadTime(content);

    const newBlog = await Blog.create({
      title,
      slug: finalSlug,
      excerpt: excerpt || title,
      content,
      coverImage: coverImage || '',
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [],
      readTime,
      published: published !== undefined ? Boolean(published) : true,
    });

    const response = NextResponse.json({ success: true, blog: newBlog }, { status: 201 });
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('[CREATE_BLOG_ERROR]', error);
    const response = NextResponse.json(
      { error: 'Failed to create blog', code: 'SERVER_ERROR' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
