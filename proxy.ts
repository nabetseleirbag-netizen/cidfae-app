import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, bypass auth (demo mode)
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isLoginPage = request.nextUrl.pathname === '/login'
  const isStaticAsset =
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    Boolean(
      request.nextUrl.pathname.match(
        /\.(ico|png|svg|jpg|jpeg|gif|webp|json|txt|xml|woff|woff2)$/
      )
    )

  if (isStaticAsset) return supabaseResponse

  if (!session && !isLoginPage) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
