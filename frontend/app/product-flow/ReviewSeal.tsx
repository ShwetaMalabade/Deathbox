"use client"

import { useState } from "react"
import { checkinPackage, getFrontendContract, getIntegrationStatus, getPackage, narratePackage, sealPackage } from "./api"

export function ReviewSeal({
  packageData,
  validation,
  refreshValidation,
}: {
  packageData: any
  validation: any
  refreshValidation: (nextPackageData: any) => Promise<any>
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [days, setDays] = useState("30")
  const [loading, setLoading] = useState(false)
  const [sealedPackageId, setSealedPackageId] = useState("")
  const [packageView, setPackageView] = useState<any>(null)
  const [narrationScript, setNarrationScript] = useState("")
  const [audioUrl, setAudioUrl] = useState("")
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState("")

  const foundCount = Array.isArray(packageData?.found) ? packageData.found.length : 0
  const missingCount = Array.isArray(packageData?.missing) ? packageData.missing.length : 0
  const completeness = foundCount + missingCount === 0 ? 0 : Math.round((foundCount / (foundCount + missingCount)) * 100)

  async function handleSeal() {
    try {
      setLoading(true)
      const latestValidation = await refreshValidation(packageData)
      if (!latestValidation?.ready_to_seal) {
        const todos = (latestValidation?.todo_items || []).slice(0, 5).join("\n• ")
        alert(`Please complete mandatory details first.\n• ${todos}`)
        return
      }
      const res = await sealPackage({ package_data: packageData, recipient_name: name, recipient_email: email, checkin_days: Number(days) })
      setSealedPackageId(res.package_id || "")
      alert("Sealed successfully")
      console.log(res)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Seal failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleFetchPackage(force: boolean) {
    const packageId = sealedPackageId.trim()
    if (!packageId) {
      alert("Seal first or enter a package ID.")
      return
    }
    try {
      setActionLoading("fetch")
      const data = await getPackage(packageId, force)
      setPackageView(data)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Failed to fetch package")
    } finally {
      setActionLoading("")
    }
  }

  async function handleCheckin() {
    const packageId = sealedPackageId.trim()
    if (!packageId) {
      alert("Enter or seal a package ID first.")
      return
    }
    try {
      setActionLoading("checkin")
      const data = await checkinPackage(packageId)
      alert(`Check-in successful.\nNext check-in: ${data.next_checkin}`)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Check-in failed")
    } finally {
      setActionLoading("")
    }
  }

  async function handleNarrate() {
    const packageId = sealedPackageId.trim()
    if (!packageId) {
      alert("Enter or seal a package ID first.")
      return
    }
    try {
      setActionLoading("narrate")
      setNarrationScript("")
      const result = await narratePackage(packageId)
      if (result.kind === "audio") {
        const url = URL.createObjectURL(result.audioBlob)
        setAudioUrl(url)
        alert("Narration audio generated.")
      } else {
        setAudioUrl("")
        setNarrationScript(result.data?.script || "")
        alert("Audio unavailable, fallback script received.")
      }
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Narration failed")
    } finally {
      setActionLoading("")
    }
  }

  async function handleIntegrationStatus() {
    try {
      setActionLoading("status")
      const data = await getIntegrationStatus()
      setDiagnostics(data)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Failed to load integration status")
    } finally {
      setActionLoading("")
    }
  }

  async function handleFrontendContract() {
    try {
      setActionLoading("contract")
      const data = await getFrontendContract()
      setDiagnostics(data)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Failed to load frontend contract")
    } finally {
      setActionLoading("")
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h3 className="mb-4 text-2xl font-bold">Review & Seal</h3>

      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <div className="mb-2 text-sm text-muted-foreground">Completeness</div>
        <div className="mb-2 text-foreground text-lg font-semibold">{completeness}%</div>
        <div className="text-sm text-muted-foreground">Found: {foundCount} • Missing: {missingCount}</div>
        {validation?.ready_to_seal === false && (
          <div className="mt-3 text-sm text-amber-600">Mandatory details are still missing. Please fill gaps before sealing.</div>
        )}
        {validation?.ready_to_seal === true && (
          <div className="mt-3 text-sm text-green-600">Validation passed. Package is ready to seal.</div>
        )}
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

        <label className="mb-1 block text-sm text-muted-foreground">Package ID (auto-filled after seal)</label>
        <input
          className="mb-3 w-full rounded-md border border-border bg-background p-2"
          value={sealedPackageId}
          onChange={(e) => setSealedPackageId(e.target.value)}
          placeholder="pkg_xxxxxxxx"
        />
      </div>

      <div className="flex gap-3">
        <button onClick={handleSeal} disabled={loading} className="rounded-full bg-amber px-6 py-2 text-sm font-semibold text-primary-foreground">{loading ? "Sealing..." : "Seal"}</button>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        <div className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Post-seal API checks</div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => handleFetchPackage(false)} disabled={actionLoading !== ""} className="rounded-full border border-border px-4 py-2 text-sm">
            {actionLoading === "fetch" ? "Loading..." : "Get Package (locked check)"}
          </button>
          <button onClick={() => handleFetchPackage(true)} disabled={actionLoading !== ""} className="rounded-full border border-border px-4 py-2 text-sm">
            {actionLoading === "fetch" ? "Loading..." : "Get Package (force unlock)"}
          </button>
          <button onClick={handleCheckin} disabled={actionLoading !== ""} className="rounded-full border border-border px-4 py-2 text-sm">
            {actionLoading === "checkin" ? "Checking in..." : "Check-in"}
          </button>
          <button onClick={handleNarrate} disabled={actionLoading !== ""} className="rounded-full border border-border px-4 py-2 text-sm">
            {actionLoading === "narrate" ? "Generating..." : "Narrate"}
          </button>
          <button onClick={handleIntegrationStatus} disabled={actionLoading !== ""} className="rounded-full border border-border px-4 py-2 text-sm">
            {actionLoading === "status" ? "Loading..." : "Integration Status"}
          </button>
          <button onClick={handleFrontendContract} disabled={actionLoading !== ""} className="rounded-full border border-border px-4 py-2 text-sm">
            {actionLoading === "contract" ? "Loading..." : "Frontend Contract"}
          </button>
        </div>
      </div>

      {packageView && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <div className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Package response</div>
          <pre className="overflow-x-auto text-xs text-foreground">{JSON.stringify(packageView, null, 2)}</pre>
        </div>
      )}

      {(audioUrl || narrationScript) && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <div className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Narration output</div>
          {audioUrl && (
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/mpeg" />
            </audio>
          )}
          {narrationScript && <pre className="mt-3 whitespace-pre-wrap text-xs text-foreground">{narrationScript}</pre>}
        </div>
      )}

      {diagnostics && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <div className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Diagnostics response</div>
          <pre className="overflow-x-auto text-xs text-foreground">{JSON.stringify(diagnostics, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
