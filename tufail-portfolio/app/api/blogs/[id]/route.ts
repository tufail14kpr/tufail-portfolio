import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';
import mongoose from 'mongoose';
import { authenticateAdmin, applySecurityHeaders } from '@/lib/auth';

function calculateReadTime(text: string): string {
  const wordsPerMinute = 200;
  const words = text ? text.trim().split(/\s+/).length : 0;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${Math.max(1, minutes)} min read`;
}

// GET /api/blogs/[id] - Fetch single blog by ID or slug (and increment views)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    let query: Record<string, any> = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { slug: id }] };
    } else {
      query = { slug: id };
    }

    const blog = await Blog.findOneAndUpdate(
      query,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) {
      const response = NextResponse.json({ error: 'Blog not found', code: 'NOT_FOUND' }, { status: 404 });
      return applySecurityHeaders(response);
    }

    const response = NextResponse.json({ success: true, blog }, { status: 200 });
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('[GET_BLOG_ERROR]', error);
    const response = NextResponse.json({ error: 'Failed to fetch blog', code: 'SERVER_ERROR' }, { status: 500 });
    return applySecurityHeaders(response);
  }
}

// PUT /api/blogs/[id] - Update blog (Protected via authenticateAdmin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    await connectDB();

    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug.toLowerCase().trim();
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) {
      updateData.content = content;
      updateData.readTime = calculateReadTime(content);
    }
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [];
    }
    if (published !== undefined) updateData.published = Boolean(published);

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedBlog) {
      const response = NextResponse.json({ error: 'Blog not found', code: 'NOT_FOUND' }, { status: 404 });
      return applySecurityHeaders(response);
    }

    const response = NextResponse.json({ success: true, blog: updatedBlog }, { status: 200 });
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('[UPDATE_BLOG_ERROR]', error);
    const response = NextResponse.json({ error: 'Failed to update blog', code: 'SERVER_ERROR' }, { status: 500 });
    return applySecurityHeaders(response);
  }
}

// DELETE /api/blogs/[id] - Delete blog (Protected via authenticateAdmin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await authenticateAdmin(request);
    if (!authResult.authenticated) {
      return (
        authResult.errorResponse ||
        applySecurityHeaders(
          NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
        )
      );
    }

    await connectDB();
    const deletedBlog = await Blog.findByIdAndDelete(id);

    if (!deletedBlog) {
      const response = NextResponse.json({ error: 'Blog not found', code: 'NOT_FOUND' }, { status: 404 });
      return applySecurityHeaders(response);
    }

    const response = NextResponse.json(
      { success: true, message: 'Blog deleted successfully' },
      { status: 200 }
    );
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('[DELETE_BLOG_ERROR]', error);
    const response = NextResponse.json({ error: 'Failed to delete blog', code: 'SERVER_ERROR' }, { status: 500 });
    return applySecurityHeaders(response);
  }
}
