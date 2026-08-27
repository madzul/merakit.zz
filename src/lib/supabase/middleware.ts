import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Seluruh route di dalam grup (dashboard) — hanya boleh diakses setelah login.
const PROTECTED_PATHS = [
  "/dashboard",
  "/produksi",
  "/anggota",
  "/produk",
  "/pesanan",
  "/keuangan",
  "/pemasaran",
  "/promo",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // PENTING: getUser() memvalidasi token ke server Supabase (bukan sekadar
  // membaca cookie), sehingga sesi selalu tervalidasi & ter-refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
