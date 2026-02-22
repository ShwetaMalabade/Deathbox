"use client"

import React from "react"

export function ChecklistScreen({
  packageData,
  setPackageData,
  validation,
  onFillGaps,
  onReview,
}: {
  packageData: any
  setPackageData: (p: any) => void
  validation: any
  onFillGaps: () => void
  onReview: () => void
}) {
  const sections = [
    { label: "bank accounts", keys: ["total_bank_balance"] },
    { label: "investments", keys: ["investments"] },
    { label: "insurance", keys: ["insurance_policies"] },
    { label: "credit cards", keys: ["active_credit_cards"] },
    { label: "loans taken", keys: ["loan_taken"] },
    { label: "loans given", keys: ["loan_given"] },
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

  function toSectionKey(item: any) {
    const itemType = String(item?.type || "").toLowerCase()
    const map: Record<string, string> = {
      bank_account: "total_bank_balance",
      checking: "total_bank_balance",
      savings: "total_bank_balance",
      investment: "investments",
      "401k": "investments",
      ira: "investments",
      stocks: "investments",
      life_insurance: "insurance_policies",
      health_insurance: "insurance_policies",
      insurance: "insurance_policies",
      credit_card: "active_credit_cards",
      credit_cards: "active_credit_cards",
      loan_taken: "loan_taken",
      auto_loan: "loan_taken",
      mortgage: "loan_taken",
      student_loan: "loan_taken",
      loan_given: "loan_given",
    }
    return map[itemType] || String(item?.section || "").toLowerCase()
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h3 className="mb-4 text-2xl font-bold">Checklist</h3>

      {Array.isArray(validation?.todo_items) && validation.todo_items.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-card p-4">
          <h4 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Mandatory TODOs</h4>
          <ul className="space-y-1 text-sm text-foreground">
            {validation.todo_items.map((todo: string, idx: number) => (
              <li key={idx}>• {todo}</li>
            ))}
          </ul>
        </div>
      )}

      {sections.map((section) => (
        <div key={section.label} className="mb-6">
          <h4 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">{section.label}</h4>
          <div className="grid gap-3">
            {/* Render found items for this section */}
            {(packageData?.found || [])
              .filter((it: any) => section.keys.includes(toSectionKey(it)))
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
              .filter((it: any) => section.keys.includes(toSectionKey(it)))
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
        <div className="mb-4 text-sm text-muted-foreground">
          {validation?.ready_to_seal ? "All mandatory details look complete." : `${missingCount} items need attention`}
        </div>

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
