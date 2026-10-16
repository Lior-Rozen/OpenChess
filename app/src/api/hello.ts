export type FetchFn = (input: string, init?: { signal?: AbortSignal }) => Promise<Response>;

/**
 * Asks the server for its greeting. Returns null when the server can't be reached,
 * answers with an error, or takes longer than `timeoutMs` — the app must keep working offline.
 */
export async function fetchServerMessage(
  baseUrl: string | undefined,
  fetchFn: FetchFn = fetch,
  timeoutMs = 5000,
): Promise<string | null> {
  if (!baseUrl) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `${baseUrl.replace(/\/+$/, '')}/api/hello`;
    const response = await fetchFn(url, { signal: controller.signal });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') {
      return body.message;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
