import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setAuthCookies,
  clearAuthCookies,
  verifyRefreshToken,
  applySecurityHeaders,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('admin_refresh_token')?.value;

    if (!refreshToken) {
      const response = NextResponse.json(
        { error: 'No refresh token provided', code: 'NO_TOKEN' },
        { status: 401 }
      );
      return applySecurityHeaders(response);
    }

    // 1. Verify Refresh JWT signature & expiry
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      const response = NextResponse.json(
        { error: 'Invalid or expired refresh token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
      clearAuthCookies(response);
      return applySecurityHeaders(response);
    }

    await connectDB();
    const admin = await Admin.findById(payload.userId);

    if (!admin || !admin.isActive) {
      const response = NextResponse.json(
        { error: 'User not found or deactivated', code: 'ACCOUNT_INVALID' },
        { status: 401 }
      );
      clearAuthCookies(response);
      return applySecurityHeaders(response);
    }

    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      const response = NextResponse.json(
        { error: 'Forbidden: Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
      clearAuthCookies(response);
      return applySecurityHeaders(response);
    }

    // 2. Token Reuse / Theft Detection: verify Refresh Token is present in DB
    const oldTokenHash = hashToken(refreshToken);
    const hasValidToken = (admin.refreshTokens || []).some(
      (rt: any) => rt.tokenHash === oldTokenHash && new Date(rt.expiresAt) > new Date()
    );

    if (!hasValidToken) {
      // Possible token theft or replay: invalidate all tokens for security
      await Admin.findByIdAndUpdate(admin._id, {
        $set: { refreshTokens: [] },
      });

      const response = NextResponse.json(
        { error: 'Refresh token revoked or reused. All sessions terminated.', code: 'TOKEN_REVOKED' },
        { status: 401 }
      );
      clearAuthCookies(response);
      return applySecurityHeaders(response);
    }

    // 3. Token Rotation: generate brand new access & refresh tokens
    const newAccessToken = generateAccessToken(admin);
    const { token: newRefreshToken, expiresAt } = generateRefreshToken(admin);
    const newTokenHash = hashToken(newRefreshToken);

    // 4. Update DB: Remove old token hash and add new token hash atomically
    const now = new Date();
    const rotatedTokens = (admin.refreshTokens || [])
      .filter((rt: any) => rt.tokenHash !== oldTokenHash && new Date(rt.expiresAt) > now);
    rotatedTokens.push({ tokenHash: newTokenHash, createdAt: now, expiresAt });

    await Admin.findByIdAndUpdate(admin._id, {
      $set: { refreshTokens: rotatedTokens },
    });

    // 5. Build response and set rotated HttpOnly cookies
    const response = NextResponse.json(
      {
        success: true,
        message: 'Tokens rotated and refreshed successfully',
        user: {
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      { status: 200 }
    );

    setAuthCookies(response, newAccessToken, newRefreshToken);
    applySecurityHeaders(response);

    return response;
  } catch (error: any) {
    console.error('[ADMIN_REFRESH_ERROR]', error);
    const response = NextResponse.json(
      { error: error?.message || 'Failed to refresh token', code: 'SERVER_ERROR' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
