const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${BACKEND_BASE_URL}${path}`, init)
  if (!res.ok) {
    let message = "Request failed"
    try {
      const body = await res.json()
      if (typeof body?.detail === "string") {
        message = body.detail
      } else if (typeof body?.detail?.message === "string") {
        message = body.detail.message
      } else if (typeof body?.message === "string") {
        message = body.message
      }
    } catch {
      message = `Request failed (${res.status})`
    }
    throw new Error(message)
  }
  return res
}

export async function analyzeTranscript(text: string) {
  const res = await request("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: text }),
  })
  return res.json()
}

export async function extractDocument(file: File) {
  const fd = new FormData()
  fd.append("file", file)
  const res = await request("/api/extract-doc", {
    method: "POST",
    body: fd,
  })
  return res.json()
}

export async function validatePackage(packageData: any) {
  const res = await request("/api/validate-package", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ package_data: packageData }),
  })
  return res.json()
}

export async function sealPackage(payload: any) {
  const res = await request("/api/seal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function getPackage(packageId: string, force = false) {
  const query = force ? "?force=true" : ""
  const res = await request(`/api/package/${packageId}${query}`, { method: "GET" })
  return res.json()
}

export async function checkinPackage(packageId: string) {
  const res = await request("/api/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ package_id: packageId }),
  })
  return res.json()
}

export async function narratePackage(packageId: string) {
  const res = await request("/api/narrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ package_id: packageId }),
  })

  const contentType = res.headers.get("content-type") || ""
  if (contentType.includes("audio/mpeg")) {
    const audioBlob = await res.blob()
    return { kind: "audio" as const, audioBlob }
  }

  return { kind: "json" as const, data: await res.json() }
}

export async function getIntegrationStatus() {
  const res = await request("/api/integration-status", { method: "GET" })
  return res.json()
}

export async function getFrontendContract() {
  const res = await request("/api/frontend-contract", { method: "GET" })
  return res.json()
}
