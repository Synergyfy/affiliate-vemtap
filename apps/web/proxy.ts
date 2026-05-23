import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Basic JWT decoder for Edge Runtime (atob based)
 */
function getRoleFromToken(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload).role;
  } catch (e) {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get tokens from cookies
  const accessToken = request.cookies.get('access_token')?.value || request.cookies.get('vemtap-auth-token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  
  // Check if client-side explicitly set a logged out state to bypass stale httpOnly cookies
  const isLoggedOut = request.cookies.get('vemtap_logged_out')?.value === 'true';
  
  const isAuthenticated = (!!accessToken || !!refreshToken) && !isLoggedOut;
  
  const allCookies = request.cookies.getAll().map(c => c.name);
  console.log(`[Proxy Middleware] Path: ${pathname}, Auth: ${isAuthenticated}, StaleCookiesIgnored: ${isLoggedOut}, All Cookies: [${allCookies.join(', ')}]`);
  
  // Extract role for RBAC
  const role = isAuthenticated ? (accessToken ? getRoleFromToken(accessToken) : (refreshToken ? getRoleFromToken(refreshToken) : null)) : null;

  // Define route patterns
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/capture',
    '/support',
    '/terms',
    '/privacy',
    '/cookies',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/manifest.json',
    '/sw.js',
    '/sw.js.map'
  ];

  const isPublicRoute = 
    publicPaths.some(path => pathname === path || pathname.startsWith(path + '/')) || 
    pathname.startsWith('/_next') || 
    pathname.includes('/api/') ||
    pathname.includes('.') || // Any file with an extension
    pathname.startsWith('/assets/');
    
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isProtectedRoute = !isPublicRoute;

  // 1. Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect authenticated users from auth routes to their correct dashboard
  if (isAuthRoute && isAuthenticated && role) {
    const target = (role === 'ADMIN' || role === 'SUPER_ADMIN') ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // 3. Enforce Role-Based Access Control (RBAC)
  if (isAuthenticated && role) {
    // Admins cannot access the Affiliate Dashboard
    if (pathname.startsWith('/dashboard') && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    
    // Affiliates and Agents cannot access the Admin Dashboard
    if (pathname.startsWith('/admin') && (role === 'AFFILIATE' || role === 'AGENT')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|manifest.json|sw.js|.*\\..*).*)',
  ],
};
