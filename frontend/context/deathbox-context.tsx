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

  // Recipient info
  recipientName: string
  recipientEmail: string

  // Sealed Package
  sealResult: SealResponse | null
  isSealing: boolean

  // Actions
  setStage: (stage: FlowStage) => void
  setRecipientName: (name: string) => void
  setRecipientEmail: (email: string) => void
  startRecording: () => Promise<void>
  stopRecording: () => void
  processRecording: (blob: Blob) => Promise<void>
  updateAnalysis: (data: AnalyzeResponse) => void
  sealCurrentPackage: (recipientName: string, recipientEmail: string) => Promise<SealResponse>
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
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(
    null
  )
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Voice clone state
  const [isCloningVoice, setIsCloningVoice] = useState(false)
  const [voiceId, setVoiceId] = useState<string | null>(null)
  const [voiceCloneError, setVoiceCloneError] = useState<string | null>(null)

  // Recipient info state
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")

  // Sealed package state
  const [sealResult, setSealResult] = useState<SealResponse | null>(null)
  const [isSealing, setIsSealing] = useState(false)

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

  /**
   * After recording stops, the blob is ready. This function:
   * 1) Transcribes audio via ElevenLabs STT
   * 2) Sends transcript to backend /api/analyze (Gemini)
   * 3) Kicks off voice cloning in parallel
   */
  const processRecording = useCallback(async (blob: Blob) => {
    // --- Step 1: Transcribe ---
    setIsTranscribing(true)
    setStage("processing")
    let text = ""
    try {
      text = await speechToText(blob)
      setTranscript(text)
    } catch (err) {
      console.error("STT error:", err)
      setAnalysisError(
        err instanceof Error ? err.message : "Transcription failed"
      )
      setIsTranscribing(false)
      return
    }
    setIsTranscribing(false)

    // --- Step 2 & 3: Analyze + Clone in parallel ---
    setIsAnalyzing(true)
    setIsCloningVoice(true)

    const analyzePromise = analyzeTranscript(text)
      .then((result) => {
        setAnalysisResult(result)
        setAnalysisError(null)
      })
      .catch((err) => {
        console.error("Analysis error:", err)
        setAnalysisError(
          err instanceof Error ? err.message : "Analysis failed"
        )
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
        setVoiceCloneError(
          err instanceof Error ? err.message : "Voice clone failed"
        )
      })
      .finally(() => setIsCloningVoice(false))

    await Promise.all([analyzePromise, clonePromise])
    setStage("checklist")
  }, [])

  const updateAnalysis = useCallback((data: AnalyzeResponse) => {
    setAnalysisResult(data)
  }, [])

  const sealCurrentPackage = useCallback(
    async (recipientName: string, recipientEmail: string) => {
      if (!analysisResult) throw new Error("No analysis data to seal")
      setIsSealing(true)
      try {
        const res = await sealPackage({
          package_data: analysisResult as unknown as Record<string, unknown>,
          recipient_name: recipientName,
          recipient_email: recipientEmail,
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
    },
    [analysisResult, voiceId]
  )

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
        recipientName,
        recipientEmail,
        sealResult,
        isSealing,
        setStage,
        setRecipientName,
        setRecipientEmail,
        startRecording,
        stopRecording,
        processRecording,
        updateAnalysis,
        sealCurrentPackage,
      }}
    >
      {children}
    </DeathBoxContext.Provider>
  )
}
