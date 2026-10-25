/** Typed Cloudflare Worker bindings (D1 + KV). */
export async function getWorkerEnv(): Promise<Env | null> {
  try {
    const mod = await import('cloudflare:workers');
    return (mod as { env: Env }).env;
  } catch {
    return null;
  }
}
