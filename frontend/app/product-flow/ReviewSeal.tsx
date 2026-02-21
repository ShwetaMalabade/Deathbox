"use client"

import { useState } from "react"
import { sealPackage } from "./api"

export function ReviewSeal({ packageData }: { packageData: any }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [days, setDays] = useState("30")
  const [loading, setLoading] = useState(false)

  const foundCount = Array.isArray(packageData?.found) ? packageData.found.length : 0
  const missingCount = Array.isArray(packageData?.missing) ? packageData.missing.length : 0
  const completeness = foundCount + missingCount === 0 ? 0 : Math.round((foundCount / (foundCount + missingCount)) * 100)

  async function handleSeal() {
    try {
      setLoading(true)
      const res = await sealPackage({ package_data: packageData, recipient_name: name, recipient_email: email, checkin_days: Number(days) })
      alert("Sealed successfully")
      console.log(res)
    } catch (e) {
      console.error(e)
      alert("Seal failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h3 className="mb-4 text-2xl font-bold">Review & Seal</h3>

      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <div className="mb-2 text-sm text-muted-foreground">Completeness</div>
        <div className="mb-2 text-foreground text-lg font-semibold">{completeness}%</div>
        <div className="text-sm text-muted-foreground">Found: {foundCount} • Missing: {missingCount}</div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm text-muted-foreground">Recipient name</label>
        <input className="mb-3 w-full rounded-md border border-border bg-background p-2" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="mb-1 block text-sm text-muted-foreground">Recipient email</label>
        <input className="mb-3 w-full rounded-md border border-border bg-background p-2" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="mb-1 block text-sm text-muted-foreground">Check-in interval (days)</label>
        <select value={days} onChange={(e) => setDays(e.target.value)} className="mb-3 w-full rounded-md border border-border bg-background p-2">
          <option value="7">7</option>
          <option value="30">30</option>
          <option value="90">90</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSeal} disabled={loading} className="rounded-full bg-amber px-6 py-2 text-sm font-semibold text-primary-foreground">{loading ? "Sealing..." : "Seal"}</button>
      </div>
    </div>
  )
}
