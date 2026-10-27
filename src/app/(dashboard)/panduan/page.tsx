import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Lightbulb, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PrintGuideButton } from "@/components/panduan/print-guide-button";
import { ROLE_LABELS, guideForRole } from "@/lib/panduan/content";
import { getCurrentProfile } from "@/lib/supabase/repositories/profiles-repository";
import type { UserRole } from "@/lib/types";

/**
 * Manual Penggunaan — satu menu untuk semua pengguna login. Isi disaring
 * menurut peran (admin melihat semua; anggota hanya bagian yang bisa ia
 * pakai), sumbernya `src/lib/panduan/content.ts`.
 */
export default async function PanduanPage() {
  const profile = await getCurrentProfile().catch(() => null);
  if (!profile) redirect("/login?redirectTo=/panduan");

  const role: UserRole = profile.role === "admin" ? "admin" : "anggota";
  const sections = guideForRole(role);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Manual Penggunaan"
        description={`Panduan langkah demi langkah memakai SI-MERAKIT, disesuaikan untuk peran ${ROLE_LABELS[role]}.`}
        actions={<PrintGuideButton />}
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800 print:border-neutral-300 print:bg-white">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" aria-hidden="true" />
        <p>
          Anda masuk sebagai <strong>{profile.name}</strong> dengan peran <strong>{ROLE_LABELS[role]}</strong>.{" "}
          {role === "admin"
            ? "Anda melihat seluruh isi manual, termasuk langkah khusus anggota (berlabel “Anggota”) agar bisa memandu mereka."
            : "Manual ini hanya menampilkan menu dan langkah yang bisa Anda gunakan. Hubungi admin bila membutuhkan akses lain."}
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
        {/* Daftar isi */}
        <nav aria-label="Daftar isi manual" className="mb-6 lg:mb-0 print:hidden">
          <div className="rounded-xl border border-neutral-200 bg-white p-3 lg:sticky lg:top-6">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Daftar Isi</p>
            <ol className="grid grid-cols-1 gap-0.5 sm:grid-cols-2 lg:grid-cols-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 text-neutral-400" aria-hidden="true" />
                      <span className="truncate">{section.title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>

        <div className="flex min-w-0 flex-col gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const access = section.access?.[role];
            return (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-judul`}
                className="scroll-mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-card print:break-inside-avoid-page print:shadow-none sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 id={`${section.id}-judul`} className="text-lg font-semibold text-neutral-800">
                        {section.title}
                      </h2>
                      <p className="mt-0.5 text-sm text-neutral-500">{section.summary}</p>
                    </div>
                  </div>
                  {section.href && (
                    <Link
                      href={section.href}
                      className="inline-flex flex-shrink-0 items-center gap-1 self-start rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50 print:hidden"
                    >
                      Buka menu <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>

                {access && (
                  <p className="mt-4 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                    <span className="font-medium text-neutral-700">Akses {ROLE_LABELS[role]}:</span> {access}
                  </p>
                )}

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  {section.topics.map((topic) => (
                    <div key={topic.title} className="min-w-0">
                      <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-neutral-800">
                        {topic.title}
                        {role === "admin" && topic.roles?.length === 1 && <RoleTag role={topic.roles[0]} />}
                      </h3>
                      <ol className="mt-2 space-y-2">
                        {topic.steps.map((step, index) => (
                          <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-neutral-600">
                            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
                              {index + 1}
                            </span>
                            <span className="min-w-0">
                              {step.text}
                              {role === "admin" && step.roles?.length === 1 && !topic.roles && (
                                <>
                                  {" "}
                                  <RoleTag role={step.roles[0]} />
                                </>
                              )}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>

                {section.tips && section.tips.length > 0 && (
                  <div className="mt-5 flex items-start gap-2 rounded-lg bg-secondary-50 px-3 py-2.5 text-sm text-neutral-700">
                    <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary-700" aria-hidden="true" />
                    <div>
                      {section.tips.map((tip) => (
                        <p key={tip.text}>{tip.text}</p>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RoleTag({ role }: { role: UserRole }) {
  return (
    <span
      className={
        role === "admin"
          ? "inline-flex rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700"
          : "inline-flex rounded-full bg-secondary-50 px-2 py-0.5 text-[11px] font-medium text-secondary-700"
      }
    >
      {role === "admin" ? "Khusus Admin" : "Anggota"}
    </span>
  );
}
