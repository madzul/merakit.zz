import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Halaman awal: pengguna yang sudah login langsung ke dashboard, pengunjung
 * umum (calon pembeli) diarahkan ke katalog publik.
 */
export default async function RootPage() {
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    isLoggedIn = Boolean(data.user);
  } catch {
    isLoggedIn = false;
  }
  redirect(isLoggedIn ? "/dashboard" : "/katalog");
}
