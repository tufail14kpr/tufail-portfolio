import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setAuthCookies,
  applySecurityHeaders,
} from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

// Helper to extract client IP for rate limiting
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

// Auto-seed initial admin on fresh setup if DB has zero admins
async function ensureAdminSeeded() {
  try {
    const defaultEmail = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@tufail.dev').toLowerCase().trim();
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

    const admin = await Admin.findOne({ email: defaultEmail });
    if (!admin) {
      await Admin.create({
        name: 'Md Tufail',
        email: defaultEmail,
        password: defaultPassword,
        role: 'admin',
        isActive: true,
        loginAttempts: 0,
      });
      console.log(`[SEED] Admin account initialized: ${defaultEmail}`);
    }
  } catch (err) {
    console.error('[SEED_ERROR]', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);

    // 1. IP-level Rate Limiting: Max 10 attempts per 15 minutes per IP
    const rateCheck = checkRateLimit(`login_${clientIp}`, 10, 15 * 60 * 1000);
    if (!rateCheck.success) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            error: 'Too many login attempts from this IP. Please try again in 15 minutes.',
            code: 'RATE_LIMITED',
          },
          { status: 429 }
        )
      );
    }

    // 2. Parse & Validate input
    let body: any;
    try {
      body = await request.json();
    } catch {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Invalid JSON payload', code: 'INVALID_PAYLOAD' },
          { status: 400 }
        )
      );
    }

    const { email, password } = body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Email and password are required', code: 'MISSING_FIELDS' },
          { status: 400 }
        )
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail.length > 255 || password.length > 128) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Invalid input length', code: 'INVALID_LENGTH' },
          { status: 400 }
        )
      );
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Please provide a valid email address', code: 'INVALID_EMAIL' },
          { status: 400 }
        )
      );
    }

    // 3. Database connection & Auto-seed check
    await connectDB();
    await ensureAdminSeeded();

    // 4. Query admin by email (lowercase) - use .lean() to bypass Mongoose document wrapper issues
    const admin: any = await Admin.findOne({ email: trimmedEmail }).lean();

    // Generic error message to prevent account enumeration
    if (!admin) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
          { status: 401 }
        )
      );
    }

    // 5. Brute-force protection: check if account is locked (INLINE – avoids Mongoose method caching bug)
    const isAccountLocked = !!(admin.lockUntil && new Date(admin.lockUntil).getTime() > Date.now());
    if (isAccountLocked) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            error: 'Account is temporarily locked due to too many failed login attempts. Please try again in 15 minutes.',
            code: 'ACCOUNT_LOCKED',
          },
          { status: 429 }
        )
      );
    }

    // 6. Verify password with bcrypt (INLINE – avoids Mongoose method caching bug)
    let isPasswordValid = false;
    if (admin.password && password) {
      if (admin.password.startsWith('$2')) {
        isPasswordValid = await bcrypt.compare(password, admin.password);
      } else {
        isPasswordValid = admin.password === password;
      }
    }

    if (!isPasswordValid) {
      // Increment login attempts (INLINE)
      const nextAttempts = (admin.loginAttempts || 0) + 1;
      const updates: any = { $set: { loginAttempts: nextAttempts } };
      if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
        updates.$set.lockUntil = new Date(Date.now() + LOCK_TIME);
      }
      await Admin.findByIdAndUpdate(admin._id, updates);

      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
          { status: 401 }
        )
      );
    }

    // 7. Account Active Check
    if (!admin.isActive) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            error: 'Your admin account has been disabled. Please contact system administrator.',
            code: 'ACCOUNT_DISABLED',
          },
          { status: 403 }
        )
      );
    }

    // 8. Role Check (RBAC)
    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      return applySecurityHeaders(
        NextResponse.json(
          {
            error: 'Forbidden: Admin authorization required',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        )
      );
    }

    // 9. Generate Access (15m) and Refresh (14d) Tokens
    const accessToken = generateAccessToken(admin);
    const { token: refreshToken, expiresAt } = generateRefreshToken(admin);

    // 10. Store SHA-256 hashed refresh token and reset attempts in DB atomically
    const tokenHash = hashToken(refreshToken);
    const now = new Date();
    const validRefreshTokens = (admin.refreshTokens || []).filter(
      (rt: any) => new Date(rt.expiresAt) > now
    );
    validRefreshTokens.push({ tokenHash, createdAt: now, expiresAt });

    await Admin.findByIdAndUpdate(admin._id, {
      $set: {
        refreshTokens: validRefreshTokens,
        loginAttempts: 0,
      },
      $unset: {
        lockUntil: 1,
      },
    });

    // 11. Build response and set HttpOnly Secure Cookies
    const response = NextResponse.json(
      {
        success: true,
        message: 'Admin login successful',
        user: {
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      { status: 200 }
    );

    setAuthCookies(response, accessToken, refreshToken);
    applySecurityHeaders(response);

    return response;
  } catch (error: any) {
    console.error('[ADMIN_LOGIN_ERROR]', error);
    return applySecurityHeaders(
      NextResponse.json(
        {
          error: error?.message || 'Internal server error during login',
          code: 'SERVER_ERROR',
          details: error?.stack || String(error),
        },
        { status: 500 }
      )
    );
  }
}
