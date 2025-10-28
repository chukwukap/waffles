/**
 * Generic fetcher function for SWR.
 * Usage: useSWR(key, fetcher)
 */
export async function fetcher<T>(
  input: string | Request,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, { cache: "no-store", ...init });

  if (!res.ok) {
    let errMsg = `Fetcher error: ${res.status} ${res.statusText}`;
    try {
      // Try to parse error body if possible
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        if (
          errorData &&
          typeof errorData === "object" &&
          "error" in errorData
        ) {
          errMsg += `: ${errorData.error}`;
        }
      } else {
        const text = await res.text();
        if (text) {
          errMsg += `: ${text}`;
        }
      }
    } catch {
      // ignore parsing errors, show generic message
    }
    throw new Error(errMsg);
  }

  // Defensive: check content type (throw if not JSON)
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Fetcher error: Response is not JSON.");
  }

  try {
    return (await res.json()) as T;
  } catch (err) {
    throw new Error("Fetcher error: Failed to parse JSON response.");
  }
}
