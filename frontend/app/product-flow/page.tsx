"use client"

import { useState } from "react"
import { RecordingScreen } from "./RecordingScreen"
import { ChecklistScreen } from "./ChecklistScreen"
import { GapFiller } from "./GapFiller"
import { ReviewSeal } from "./ReviewSeal"

export default function ProductFlowPage() {
  const [packageData, setPackageData] = useState({ found: [], missing: [], personal_info: {} })
  const [screen, setScreen] = useState<"recording" | "checklist" | "gap" | "review">("recording")

  return (
    <main className="relative min-h-screen bg-background">
      <div className="mx-auto max-w-5xl">
        {screen === "recording" && (
          <RecordingScreen
            onDone={(data: any) => {
              setPackageData(data)
              setScreen("checklist")
            }}
          />
        )}

        {screen === "checklist" && (
          <ChecklistScreen
            packageData={packageData}
            setPackageData={setPackageData}
            onFillGaps={() => setScreen("gap")}
            onReview={() => setScreen("review")}
          />
        )}

        {screen === "gap" && (
          <GapFiller
            packageData={packageData}
            setPackageData={(p: any) => setPackageData(p)}
            onBack={() => setScreen("checklist")}
            onReview={() => setScreen("review")}
          />
        )}

        {screen === "review" && <ReviewSeal packageData={packageData} />}
      </div>
    </main>
  )
}
