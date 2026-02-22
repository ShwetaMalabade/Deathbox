"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { speechToText } from "@/lib/elevenlabs"
import {
  analyzeTranscript,
  cloneVoiceOnBackend,
  sealPackage,
  getPackage,
  type AnalyzeResponse,
  type SealResponse,
} from "@/lib/api"

type FlowStage =
  | "landing"
  | "recording"
  | "processing"
  | "checklist"
  | "sealed"

interface DeathBoxState {
  stage: FlowStage

  // Recording
  audioBlob: Blob | null
  isRecording: boolean
  isTranscribing: boolean
  transcript: string

  // AI Analysis
  isAnalyzing: boolean
  analysisResult: AnalyzeResponse | null
  analysisError: string | null

  // Voice Clone
  isCloningVoice: boolean
  voiceId: string | null
  voiceCloneError: string | null

  // Sealed Package
  sealResult: SealResponse | null
  isSealing: boolean

  // Post-seal settings (configured after seal)
  checkinDays: number
  recipientName: string
  recipientEmail: string
  emotionalMessageBlob: Blob | null
  isSettingsSaved: boolean

  // Release (demo)
  isReleased: boolean
  isReleasing: boolean
  releaseResult: { transfer_tx?: string; recipient_name?: string } | null
  releaseError: string | null

  // Actions
  setStage: (stage: FlowStage) => void
  setCheckinDays: (days: number) => void
  setRecipientName: (name: string) => void
  setRecipientEmail: (email: string) => void
  setEmotionalMessageBlob: (blob: Blob | null) => void
  startRecording: () => Promise<void>
  stopRecording: () => void
  processRecording: (blob: Blob) => Promise<void>
  updateAnalysis: (data: AnalyzeResponse) => void
  sealCurrentPackage: () => Promise<SealResponse>
  saveSettings: () => void
  releasePackage: () => Promise<void>
}

const DeathBoxContext = createContext<DeathBoxState | null>(null)

export function useDeathBox() {
  const ctx = useContext(DeathBoxContext)
  if (!ctx) throw new Error("useDeathBox must be used within DeathBoxProvider")
  return ctx
}

export function DeathBoxProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<FlowStage>("landing")

  // Recording state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState("")

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Voice clone state
  const [isCloningVoice, setIsCloningVoice] = useState(false)
  const [voiceId, setVoiceId] = useState<string | null>(null)
  const [voiceCloneError, setVoiceCloneError] = useState<string | null>(null)

  // Sealed package state
  const [sealResult, setSealResult] = useState<SealResponse | null>(null)
  const [isSealing, setIsSealing] = useState(false)

  // Post-seal settings
  const [checkinDays, setCheckinDays] = useState(30)
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [emotionalMessageBlob, setEmotionalMessageBlob] = useState<Blob | null>(null)
  const [isSettingsSaved, setIsSettingsSaved] = useState(false)

  // Release state
  const [isReleased, setIsReleased] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [releaseResult, setReleaseResult] = useState<{
    transfer_tx?: string
    recipient_name?: string
  } | null>(null)
  const [releaseError, setReleaseError] = useState<string | null>(null)

  const startRecording = useCallback(async () => {
    try {
      if (!window.isSecureContext) {
        setAnalysisError(
          "Microphone access requires HTTPS in production. Open this app on an https:// URL."
        )
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      })

      const chunks: BlobPart[] = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setTranscript("")
      setAnalysisResult(null)
      setAnalysisError(null)
      setVoiceId(null)
      setVoiceCloneError(null)
    } catch (err) {
      console.error("Microphone access denied:", err)
      setAnalysisError(
        err instanceof Error
          ? err.message
          : "Microphone access failed. Please allow microphone permission in your browser."
      )
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setIsRecording(false)
    }
  }, [mediaRecorder])

  const processRecording = useCallback(async (blob: Blob) => {
    setIsTranscribing(true)
    setStage("processing")
    let text = ""
    try {
      text = await speechToText(blob)
      setTranscript(text)
    } catch (err) {
      console.error("STT error:", err)
      setAnalysisError(err instanceof Error ? err.message : "Transcription failed")
      setIsTranscribing(false)
      return
    }
    setIsTranscribing(false)

    setIsAnalyzing(true)
    setIsCloningVoice(true)

    const analyzePromise = analyzeTranscript(text)
      .then((result) => {
        setAnalysisResult(result)
        setAnalysisError(null)
      })
      .catch((err) => {
        console.error("Analysis error:", err)
        setAnalysisError(err instanceof Error ? err.message : "Analysis failed")
      })
      .finally(() => setIsAnalyzing(false))

    const clonePromise = cloneVoiceOnBackend(blob)
      .then((res) => {
        if (res.skipped) {
          console.log("Voice cloning skipped (free plan) — will use default voice")
          setVoiceId(null)
          setVoiceCloneError(null)
        } else {
          setVoiceId(res.voice_id)
          setVoiceCloneError(null)
          console.log("Voice cloned successfully, id:", res.voice_id)
        }
      })
      .catch((err) => {
        console.error("Voice clone error:", err)
        setVoiceCloneError(err instanceof Error ? err.message : "Voice clone failed")
      })
      .finally(() => setIsCloningVoice(false))

    await Promise.all([analyzePromise, clonePromise])
    setStage("checklist")
  }, [])

  const updateAnalysis = useCallback((data: AnalyzeResponse) => {
    setAnalysisResult(data)
  }, [])

  const sealCurrentPackage = useCallback(async () => {
    if (!analysisResult) throw new Error("No analysis data to seal")
    if (sealResult) return sealResult
    setIsSealing(true)
    try {
      const res = await sealPackage({
        package_data: analysisResult as unknown as Record<string, unknown>,
        checkin_days: 30,
        voice_id: voiceId ?? undefined,
        skip_validation: true,
      })
      setSealResult(res)
      setStage("sealed")
      return res
    } finally {
      setIsSealing(false)
    }
  }, [analysisResult, voiceId, sealResult])

  const saveSettings = useCallback(() => {
    setIsSettingsSaved(true)
  }, [])

  const releasePackage = useCallback(async () => {
    if (!sealResult?.package_id) throw new Error("No sealed package to release")
    setIsReleasing(true)
    setReleaseError(null)
    try {
      const result = await getPackage(sealResult.package_id, true)
      if (!result.locked) {
        setReleaseResult({
          transfer_tx: result.transfer_tx,
          recipient_name: result.recipient_name,
        })
        setIsReleased(true)
      }
    } catch (err) {
      console.error("Release error:", err)
      setReleaseError(err instanceof Error ? err.message : "Release failed")
    } finally {
      setIsReleasing(false)
    }
  }, [sealResult])

  return (
    <DeathBoxContext.Provider
      value={{
        stage,
        audioBlob,
        isRecording,
        isTranscribing,
        transcript,
        isAnalyzing,
        analysisResult,
        analysisError,
        isCloningVoice,
        voiceId,
        voiceCloneError,
        sealResult,
        isSealing,
        checkinDays,
        recipientName,
        recipientEmail,
        emotionalMessageBlob,
        isSettingsSaved,
        isReleased,
        isReleasing,
        releaseResult,
        releaseError,
        setStage,
        setCheckinDays,
        setRecipientName,
        setRecipientEmail,
        setEmotionalMessageBlob,
        startRecording,
        stopRecording,
        processRecording,
        updateAnalysis,
        sealCurrentPackage,
        saveSettings,
        releasePackage,
      }}
    >
      {children}
    </DeathBoxContext.Provider>
  )
}
