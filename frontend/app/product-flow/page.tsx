"use client"

import { useState } from "react"
import { RecordingScreen } from "./RecordingScreen"
import { ChecklistScreen } from "./ChecklistScreen"
import { GapFiller } from "./GapFiller"
import { ReviewSeal } from "./ReviewSeal"
import { validatePackage } from "./api"

export default function ProductFlowPage() {
  const [packageData, setPackageData] = useState({ found: [], missing: [], employee_info: {} })
  const [validation, setValidation] = useState<any | null>(null)
  const [screen, setScreen] = useState<"recording" | "checklist" | "gap" | "review">("recording")

  async function refreshValidation(nextPackageData: any) {
    try {
      const result = await validatePackage(nextPackageData)
      setValidation(result)
      return result
    } catch (error) {
      console.error("Failed to validate package", error)
      setValidation(null)
      return null
    }
  }

  return (
    <main className="relative min-h-screen bg-background">
      <div className="mx-auto max-w-5xl">
        {screen === "recording" && (
          <RecordingScreen
            onDone={(data: any) => {
              setPackageData(data)
              void refreshValidation(data)
              setScreen("checklist")
            }}
          />
        )}

        {screen === "checklist" && (
          <ChecklistScreen
            packageData={packageData}
            setPackageData={setPackageData}
            validation={validation}
            onFillGaps={() => setScreen("gap")}
            onReview={() => setScreen("review")}
          />
        )}

        {screen === "gap" && (
          <GapFiller
            packageData={packageData}
            setPackageData={(p: any) => {
              setPackageData(p)
              void refreshValidation(p)
            }}
            validation={validation}
            onBack={() => setScreen("checklist")}
            onReview={() => setScreen("review")}
          />
        )}

        {screen === "review" && (
          <ReviewSeal
            packageData={packageData}
            validation={validation}
            refreshValidation={refreshValidation}
          />
        )}
      </div>
    </main>
  )
}
