/**
 * `fetch` dengan batas waktu untuk semua panggilan ke Supabase.
 *
 * Tanpa ini, bila Supabase lambat/tidak bisa dijangkau (mis. project Supabase
 * sedang di-pause, atau env var URL salah), middleware menunggu sampai batas
 * Vercel (25 detik) lalu gagal dengan 504 MIDDLEWARE_INVOCATION_TIMEOUT.
 * Dengan timeout, permintaan gagal cepat dan aplikasi bisa menampilkan pesan
 * yang wajar.
 */
export function createFetchWithTimeout(timeoutMs: number): typeof fetch {
  return (input, init) => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;
    return fetch(input, { ...init, signal });
  };
}
