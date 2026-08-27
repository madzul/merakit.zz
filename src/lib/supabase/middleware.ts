import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Seluruh route di dalam grup (dashboard) — hanya boleh diakses setelah login.
const PROTECTED_PATHS = ["/dashboard", "/produksi", "/keuangan", "/pemasaran", "/promo"];

// Route yang hanya boleh diakses oleh role "admin" (selaras dengan RLS di
// database-schema.sql). "/dashboard/anggota" TIDAK lagi di sini — anggota
// biasa boleh membuka menu ini untuk melihat/mengedit profilnya sendiri
// (lihat pengecekan khusus rute "tambah" di bawah, dan RLS
// members_select_admin_or_own / members_update_admin_or_own untuk
// pembatasan datanya).
const ADMIN_ONLY_PATHS = ["/keuangan"];

function matchesPath(paths: string[], pathname: string) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
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

  if (!user && matchesPath(PROTECTED_PATHS, pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // "Tambah Anggota" (form tanpa query "id") hanya untuk admin. Form yang
  // sama dipakai juga untuk mode edit (?id=...) — termasuk anggota mengedit
  // profilnya sendiri — jadi TIDAK diblokir di sini; pengecekan kepemilikan
  // datanya dilakukan di halaman itu sendiri (fetch by id sudah dibatasi RLS
  // members_select_admin_or_own, ditambah pengecekan eksplisit di server).
  const isAddMemberPath = pathname === "/dashboard/anggota/tambah" && !request.nextUrl.searchParams.has("id");

  // Proteksi route admin-only di sisi server: seorang "anggota" yang login
  // tetap tidak boleh membuka /keuangan atau menambah anggota baru langsung
  // lewat URL, meski item/tombolnya sudah disembunyikan di UI untuk role
  // tersebut. RLS di database tetap jadi lapisan pertahanan utama; ini
  // lapisan kedua supaya anggota non-admin tidak melihat UI-nya sama sekali.
  if (user && (matchesPath(ADMIN_ONLY_PATHS, pathname) || isAddMemberPath)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = isAddMemberPath ? "/dashboard/anggota" : "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (user && pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
