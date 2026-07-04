import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasRefreshToken = request.cookies.has('refreshToken');
  const hasAccessToken = request.cookies.has('accessToken');

  const { pathname } = request.nextUrl;

  // Protect /dashboard, /profile, /admin, and /apply routes
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/apply')
  ) {
    if (!hasRefreshToken && !hasAccessToken) {
      const loginUrl = new URL('/login', request.url);
      // Optional: save the page they wanted to visit
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/apply/:path*',
  ],
};
