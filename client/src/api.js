function parseError(res, text) {
  try {
    const data = text ? JSON.parse(text) : {};
    if (data.error) {
      if (typeof data.error === "string") return data.error;
      if (data.error?.formErrors) return JSON.stringify(data.error.formErrors);
    }
    return data.message || res.statusText;
  } catch {
    return text || res.statusText;
  }
}

export async function api(path, options = {}) {
  const headers = { ...options.headers };
  const body = options.body;
  if (body != null && !(body instanceof FormData) && typeof body === "object") {
    headers["Content-Type"] = "application/json";
  }

  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers,
    body:
      body != null && typeof body === "object" && !(body instanceof FormData)
        ? JSON.stringify(body)
        : body,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = parseError(res, text);
    const err = new Error(typeof msg === "string" ? msg : "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function formatRupees(paise) {
  const n = Number(paise) / 100;
  return n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}
