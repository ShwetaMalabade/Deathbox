"use client"

import React from "react"

export function ChecklistScreen({
  packageData,
  setPackageData,
  onFillGaps,
  onReview,
}: {
  packageData: any
  setPackageData: (p: any) => void
  onFillGaps: () => void
  onReview: () => void
}) {
  const sections = [
    "bank accounts",
    "investments",
    "insurance",
    "credit cards",
    "loans taken",
    "loans given",
  ]

  const foundCount = Array.isArray(packageData?.found) ? packageData.found.length : 0
  const missingCount = Array.isArray(packageData?.missing) ? packageData.missing.length : 0
  const completeness = foundCount + missingCount === 0 ? 0 : Math.round((foundCount / (foundCount + missingCount)) * 100)

  function renderStatus(item: any) {
    if (!item) return "⚠"
    if (item.status === "certain" || (item.confidence && item.confidence > 0.8)) return "✔"
    if (item.status === "missing") return "✖"
    return "⚠"
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h3 className="mb-4 text-2xl font-bold">Checklist</h3>

      {sections.map((section) => (
        <div key={section} className="mb-6">
          <h4 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">{section}</h4>
          <div className="grid gap-3">
            {/* Render found items for this section */}
            {(packageData?.found || [])
              .filter((it: any) => (it.section || "").toLowerCase() === section)
              .map((it: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-lg">{renderStatus(it)}</span>
                        <div className="text-sm font-medium text-foreground">{it.title || it.name || "Untitled"}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{it.details || it.description || "—"}</div>
                      <div className="mt-2 text-xs text-muted-foreground">Confidence: {Math.round((it.confidence || 0) * 100)}%</div>
                      {it.warning && <div className="mt-1 text-xs text-amber-600">{it.warning}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button className="text-xs text-foreground underline">Add details</button>
                      <button className="text-xs text-foreground underline">Upload document</button>
                      <button className="text-xs text-foreground underline">Correct</button>
                      <button
                        className="text-xs text-foreground underline"
                        onClick={() => {
                          // mark as missing: move to missing array
                          const newFound = (packageData.found || []).filter((f: any) => f !== it)
                          const newMissing = [...(packageData.missing || []), { ...it, status: "missing" }]
                          setPackageData({ ...packageData, found: newFound, missing: newMissing })
                        }}
                      >
                        I don't have this
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {/* Render missing items for this section */}
            {(packageData?.missing || [])
              .filter((it: any) => (it.section || "").toLowerCase() === section)
              .map((it: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-lg">✖</span>
                        <div className="text-sm font-medium text-foreground">{it.title || it.name || "Missing item"}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{it.details || "—"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button className="text-xs text-foreground underline">Add details</button>
                      <button className="text-xs text-foreground underline">Upload document</button>
                      <button className="text-xs text-foreground underline">Correct</button>
                      <button className="text-xs text-foreground underline">I don't have this</button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium">Completeness</div>
          <div className="text-sm font-semibold">{completeness}%</div>
        </div>
        <div className="mb-2 h-3 w-full rounded-full bg-background">
          <div className="h-3 rounded-full bg-amber" style={{ width: `${completeness}%` }} />
        </div>
        <div className="mb-4 text-sm text-muted-foreground">{missingCount} items need attention</div>

        <div className="flex gap-3">
          <button onClick={onFillGaps} className="rounded-full bg-amber px-6 py-2 text-sm font-semibold text-primary-foreground">
            Fill gaps now
          </button>
          <button onClick={onReview} className="rounded-full border border-border px-6 py-2 text-sm">
            Seal anyway
          </button>
        </div>
      </div>
    </div>
  )
}
