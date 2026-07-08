import { NextResponse, type NextRequest } from 'next/server'

// El frontend no tiene sesión de servidor (JWT/cookies httpOnly) todavía —
// login/registro guardan el usuario en localStorage, que el middleware no
// puede leer porque corre en el servidor. Por eso app/login/page.tsx también
// escribe una cookie "rol" no-httpOnly con el rol del usuario: el middleware
// la usa solo para decidir si redirige, no como mecanismo de autenticación
// real (alguien podría falsificarla desde devtools). El backend tampoco
// valida el rol de quien llama a sus endpoints todavía, así que esto es una
// protección de navegación, no de datos.
const RUTAS_PUBLICAS = ['/login', '/', '/cuenta']

const RUTAS_ADMINISTRADOR = [
  '/usuarios',
  '/mercados',
  '/riesgo',
  '/movimientos',
  '/apuestas',
  '/eventos',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (RUTAS_PUBLICAS.includes(pathname)) {
    return NextResponse.next()
  }

  const rol = request.cookies.get('rol')?.value

  if (!rol) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const esRutaAdministrador = RUTAS_ADMINISTRADOR.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
  )

  if (esRutaAdministrador && rol !== 'ADMINISTRADOR') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Excluye el proxy /api/* (rewrite a Spring Boot en next.config.mjs — si el
  // middleware lo interceptara, redirigiría cada fetch del frontend en vez de
  // dejarlo pasar), los assets internos de Next y los archivos estáticos de /public.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)',
  ],
}
