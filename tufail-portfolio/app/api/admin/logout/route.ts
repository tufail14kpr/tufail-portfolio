import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { clearAuthCookies, hashToken, verifyRefreshToken, applySecurityHeaders } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('admin_refresh_token')?.value;

    if (refreshToken) {
      const payload = verifyRefreshToken(refreshToken);
      if (payload) {
        try {
          await connectDB();
          const tokenHash = hashToken(refreshToken);
          await Admin.findByIdAndUpdate(payload.userId, {
            $pull: { refreshTokens: { tokenHash } },
          });
        } catch (dbErr) {
          console.error('[LOGOUT_DB_ERROR]', dbErr);
        }
      }
    }

    const response = NextResponse.json(
      { success: true, message: 'Admin logged out successfully' },
      { status: 200 }
    );

    clearAuthCookies(response);
    applySecurityHeaders(response);

    return response;
  } catch (error) {
    console.error('[ADMIN_LOGOUT_ERROR]', error);
    const response = NextResponse.json(
      { success: true, message: 'Logged out' },
      { status: 200 }
    );
    clearAuthCookies(response);
    applySecurityHeaders(response);
    return response;
  }
}
