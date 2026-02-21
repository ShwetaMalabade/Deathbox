export async function analyzeTranscript(text: string) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: text }),
  })
  if (!res.ok) throw new Error("Analyze failed")
  return res.json()
}

export async function extractDocument(file: File) {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch("/api/extract-doc", {
    method: "POST",
    body: fd,
  })
  if (!res.ok) throw new Error("Extract failed")
  return res.json()
}

export async function sealPackage(payload: any) {
  const res = await fetch("/api/seal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Seal failed")
  return res.json()
}
