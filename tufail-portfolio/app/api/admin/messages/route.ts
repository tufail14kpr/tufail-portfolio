import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { authenticateAdmin, applySecurityHeaders } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/messages - Fetch all contact messages (Admin Protected)
export async function GET(request: NextRequest) {
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

    await connectDB();
    const messages = await Contact.find().sort({ createdAt: -1 });

    const response = NextResponse.json({ success: true, messages }, { status: 200 });
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('[FETCH_MESSAGES_ERROR]', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch messages', code: 'SERVER_ERROR' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}

// DELETE /api/admin/messages?id=... - Delete a contact message (Admin Protected)
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      const response = NextResponse.json(
        { error: 'Message ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }

    await connectDB();
    const deleted = await Contact.findByIdAndDelete(id);

    if (!deleted) {
      const response = NextResponse.json(
        { error: 'Message not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
      return applySecurityHeaders(response);
    }

    const response = NextResponse.json(
      { success: true, message: 'Message deleted successfully' },
      { status: 200 }
    );
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('[DELETE_MESSAGE_ERROR]', error);
    const response = NextResponse.json(
      { error: 'Failed to delete message', code: 'SERVER_ERROR' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
