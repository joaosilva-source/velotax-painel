import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Liberar assets e API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/brand')
  ) {
    return NextResponse.next();
  }

  // Proteger páginas principais e /admin
  const protectedPaths = ['/', '/admin'];
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/api/auth/signin';
    url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*'],
};
