import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/auth/signin' || 
                      path === '/auth/signup' || 
                      path === '/auth/reset-password' ||
                      path.startsWith('/f/') // Public form routes
                      
  // Get the token from cookies (you'll need to set this when users log in)
  const token = request.cookies.get('auth_token')?.value

  // Redirect logic
  if (isPublicPath && token) {
    // If user is on a public path but already logged in, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!isPublicPath && !token && !path.startsWith('/_next')) {
    // If user is not on a public path and not logged in, redirect to login
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  return NextResponse.next()
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 