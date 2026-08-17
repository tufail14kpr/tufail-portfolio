import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, applySecurityHeaders } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);

    if (!authResult.authenticated || !authResult.admin) {
      return (
        authResult.errorResponse ||
        applySecurityHeaders(
          NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
        )
      );
    }

    const admin = authResult.admin;

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

    return applySecurityHeaders(response);
  } catch (error) {
    console.error('[ADMIN_ME_ERROR]', error);
    const response = NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
