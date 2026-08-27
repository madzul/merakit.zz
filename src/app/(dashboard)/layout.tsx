"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader, type HeaderProfile } from "@/components/dashboard-header";
import { createClient } from "@/lib/supabase/client";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AN";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profile, setProfile] = useState<HeaderProfile | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // RLS "profiles_select_own_or_admin" mengizinkan pengguna membaca baris
      // profil miliknya sendiri, jadi query ini aman dijalankan dari client.
      const { data } = await supabase
        .from("profiles")
        .select("name, role, avatar_initial")
        .eq("id", user.id)
        .maybeSingle();

      if (!isMounted || !data) return;
      setProfile({
        name: data.name,
        role: data.role,
        avatarInitial: data.avatar_initial ?? initialsFromName(data.name),
      });
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-neutral-50">
      <DashboardSidebar role={profile?.role} />
      <MobileSidebar open={mobileNavOpen} onOpenChange={setMobileNavOpen} role={profile?.role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMenuClick={() => setMobileNavOpen(true)} profile={profile} />
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
