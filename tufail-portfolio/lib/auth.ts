import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin, { IAdmin } from '@/models/Admin';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'tufail_jwt_access_super_secret_key_2026_x8923';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tufail_jwt_refresh_ultra_secret_key_2026_z9184';

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '14d';
export const ACCESS_COOKIE_MAX_AGE = 15 * 60; // 15 minutes (in seconds)
export const REFRESH_COOKIE_MAX_AGE = 14 * 24 * 60 * 60; // 14 days (in seconds)

export interface AccessTokenPayload {
  userId: string;
  role: 'admin' | 'superadmin';
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

// 1. Generate Access Token (15 mins)
export function generateAccessToken(user: { _id: any; role: 'admin' | 'superadmin' }): string {
  const payload: AccessTokenPayload = {
    userId: user._id.toString(),
    role: user.role,
  };
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

// 2. Generate Refresh Token (14 days)
export function generateRefreshToken(user: { _id: any }): { token: string; tokenId: string; expiresAt: Date } {
  const tokenId = crypto.randomUUID();
  const payload: RefreshTokenPayload = {
    userId: user._id.toString(),
    tokenId,
  };
  const token = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  const expiresAt = new Date(Date.now() + REFRESH_COOKIE_MAX_AGE * 1000);
  return { token, tokenId, expiresAt };
}

// 3. Hash refresh token using SHA-256 before saving to DB
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// 4. Verify Access Token
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}

// 5. Verify Refresh Token
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    return null;
  }
}

// 6. Set HttpOnly Secure Cookies on response
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // Set Access Token Cookie
  response.cookies.set({
    name: 'admin_access_token',
    value: accessToken,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });

  // Set Refresh Token Cookie if provided
  if (refreshToken) {
    response.cookies.set({
      name: 'admin_refresh_token',
      value: refreshToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  }
}

// 7. Clear Auth Cookies
export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set({
    name: 'admin_access_token',
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  response.cookies.set({
    name: 'admin_refresh_token',
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
}

// 8. Apply Security Headers
export function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return response;
}

// 9. Backend Authentication Middleware Function (DB-backed RBAC)
export async function authenticateAdmin(request: NextRequest): Promise<{
  authenticated: boolean;
  admin: IAdmin | null;
  errorResponse?: NextResponse;
}> {
  try {
    // Read from HttpOnly cookie first, then fallback to Authorization header
    let token = request.cookies.get('admin_access_token')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return {
        authenticated: false,
        admin: null,
        errorResponse: applySecurityHeaders(
          NextResponse.json(
            { error: 'Authentication required. Please login as admin.', code: 'UNAUTHORIZED' },
            { status: 401 }
          )
        ),
      };
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return {
        authenticated: false,
        admin: null,
        errorResponse: applySecurityHeaders(
          NextResponse.json(
            { error: 'Access token expired or invalid', code: 'TOKEN_EXPIRED' },
            { status: 401 }
          )
        ),
      };
    }

    await connectDB();
    const admin = await Admin.findById(payload.userId);

    if (!admin) {
      return {
        authenticated: false,
        admin: null,
        errorResponse: applySecurityHeaders(
          NextResponse.json(
            { error: 'Admin account not found', code: 'ACCOUNT_NOT_FOUND' },
            { status: 401 }
          )
        ),
      };
    }

    // Role verification (never trust frontend-provided role)
    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      return {
        authenticated: false,
        admin: null,
        errorResponse: applySecurityHeaders(
          NextResponse.json(
            { error: 'Forbidden: Admin authorization required', code: 'FORBIDDEN' },
            { status: 403 }
          )
        ),
      };
    }

    // Active status verification
    if (!admin.isActive) {
      return {
        authenticated: false,
        admin: null,
        errorResponse: applySecurityHeaders(
          NextResponse.json(
            { error: 'Forbidden: Admin account is deactivated', code: 'ACCOUNT_DEACTIVATED' },
            { status: 403 }
          )
        ),
      };
    }

    return { authenticated: true, admin };
  } catch (error) {
    console.error('[AUTH_MIDDLEWARE_ERROR]', error);
    return {
      authenticated: false,
      admin: null,
      errorResponse: applySecurityHeaders(
        NextResponse.json(
          { error: 'Internal authentication error', code: 'AUTH_ERROR' },
          { status: 500 }
        )
      ),
    };
  }
}
