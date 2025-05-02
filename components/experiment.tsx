"use client"

import { useState, useEffect } from "react"
import ConsentPage from "./phases/consent-page"
import InstructionsPage from "./phases/instructions-page"
import ForcedTrialsWithImages from "./phases/forced-trials-with-images"
import ChoiceTrialsImages from "./phases/choice-trials-images"
import ForcedBlueAndOrange from "./phases/forced-blue-and-orange"
import BlueOrangeTrials from "./phases/blue-orange-trials"
import FinalSurvey from "./phases/final-survey"
import InterConditionInterval from "./phases/inter-condition-interval"
import FirstDescChoice from "./phases/first-desc-choice"
import FinalChoiceBlueOrange from "./phases/final-choice-blue-orange"
import SecondDescChoice from "./phases/second-desc-choice"
import CompletionPage from "./phases/completion-page"
import { useLocalStorage } from "@/hooks/use-local-storage"

export type Phase = 
  | "consent"
  | "instructions"
  | "forced-trials-with-images"
  | "forced-trials-with-images-interval"
  | "choice-trials-images"
  | "choice-trials-images-interval"
  | "first-desc-choice"
  | "first-desc-choice-interval"
  | "forced-blue-and-orange"
  | "forced-blue-and-orange-interval"
  | "blue-orange-trials"
  | "blue-orange-trials-interval"
  | "final-choice-blue-orange"
  | "final-choice-blue-orange-interval"
  | "second-desc-choice"
  | "second-desc-choice-interval"
  | "final-survey"
  | "completion"

export type ExperimentData = {
  participantId: string
  currentPhase: Phase
  trials: {
    phase: Phase
    trialNumber: number
    condition?: string
    stimulus?: string
    choice?: string
    outcome?: boolean
    points?: number
    questionType?: "probability" | "consistency"
    timestamp: number
  }[]
  totalPoints: number
  surveyResponses: Record<string, any>
}

export default function Experiment({ onComplete }: { onComplete?: () => void }) {
  const [experimentData, setExperimentData] = useLocalStorage<ExperimentData>("experiment-data", {
    participantId: "",
    currentPhase: "consent",
    trials: [],
    totalPoints: 0,
    surveyResponses: {},
  })
  const [currentPhase, setCurrentPhase] = useState<Phase>(experimentData.currentPhase)
  const [choiceTrialsAttempts, setChoiceTrialsAttempts] = useState(0)
  const MAX_CHOICE_TRIALS_ATTEMPTS = 5

  useEffect(() => {
    if (!experimentData.participantId) {
      setExperimentData(prev => ({
        ...prev,
        participantId: Math.random().toString(36).substring(2, 15)
      }))
    }
  }, [])

  const updatePhase = (newPhase: Phase) => {
    if (newPhase === "final-survey") {
      setCurrentPhase("final-survey")
      setExperimentData((prev) => ({
        ...prev,
        currentPhase: "final-survey",
      }))
    } else {
      setCurrentPhase(newPhase)
      setExperimentData((prev) => ({
        ...prev,
        currentPhase: newPhase,
        totalPoints: (newPhase === "choice-trials-images" || newPhase === "blue-orange-trials") ? 0 : prev.totalPoints,
      }))
    }
  }

  const advancePhase = () => {
    const phases: Phase[] = [
      "consent",
      "instructions",
      "forced-blue-and-orange",
      "forced-blue-and-orange-interval",
      "blue-orange-trials",
      "blue-orange-trials-interval",
      "final-choice-blue-orange",
      "final-choice-blue-orange-interval",
      "forced-trials-with-images",
      "forced-trials-with-images-interval",
      "choice-trials-images",
      "choice-trials-images-interval",
      "first-desc-choice",
      "first-desc-choice-interval",
      "second-desc-choice",
      "second-desc-choice-interval",
      "final-survey"
    ]
    const currentIndex = phases.indexOf(currentPhase)
    if (currentIndex < phases.length - 1) {
      updatePhase(phases[currentIndex + 1])
    }
  }

  const repeatPhase2 = () => {
    const nextAttempt = choiceTrialsAttempts + 1
    setChoiceTrialsAttempts(nextAttempt)
    
    if (nextAttempt >= MAX_CHOICE_TRIALS_ATTEMPTS) {
      setCurrentPhase("final-survey")
      setExperimentData(prev => ({
        ...prev,
        currentPhase: "final-survey"
      }))
    } else {
      setCurrentPhase("forced-trials-with-images")
    }
  }

  const addTrialData = (trialData: Omit<ExperimentData["trials"][0], "timestamp" | "trialNumber">) => {
    setExperimentData((prev) => {
      const newTrial = {
        ...trialData,
        trialNumber: prev.trials.length + 1,
        timestamp: Date.now(),
      }
      const newData = {
        ...prev,
        trials: [
          ...prev.trials,
          newTrial,
        ],
        totalPoints: prev.totalPoints + (trialData.points || 0),
      }
      console.log("Adding trial data:", newTrial)
      console.log("Updated experiment data:", newData)
      return newData
    })
  }

  useEffect(() => {
    if (currentPhase === "blue-orange-trials") {
      console.log("Current phase:", currentPhase, "Total Points:", experimentData.totalPoints)
    }
  }, [currentPhase, experimentData.totalPoints])

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      {/* Only show Total Points during specific phases */}
      {(currentPhase === "forced-trials-with-images" || 
        currentPhase === "forced-blue-and-orange" || 
        currentPhase === "blue-orange-trials") && (
        <div className="mb-4 text-center sticky top-0 z-10 bg-white py-4">
          <p className="text-4xl font-bold text-black-900">Total Points: {experimentData.totalPoints}</p>
        </div>
      )}

      {currentPhase === "consent" && <ConsentPage onAdvance={advancePhase} />}

      {currentPhase === "instructions" && <InstructionsPage onAdvance={advancePhase} />}

      {currentPhase === "forced-trials-with-images" && (
        <ForcedTrialsWithImages 
          onAdvance={advancePhase} 
          addTrialData={addTrialData} 
          onFail={repeatPhase2}
          setExperimentData={setExperimentData}
          experimentData={experimentData}
        />
      )}

      {currentPhase === "forced-trials-with-images-interval" && <InterConditionInterval onComplete={advancePhase} />}

      {currentPhase === "choice-trials-images" && (
        <ChoiceTrialsImages
          onAdvance={advancePhase}
          addTrialData={addTrialData}
          probabilityPairs={[{ p1: 1, p2: 0.5 }]}
          phase={currentPhase}
          onFail={repeatPhase2}
          attemptCount={choiceTrialsAttempts}
          maxAttempts={MAX_CHOICE_TRIALS_ATTEMPTS}
          setExperimentData={setExperimentData}
        />
      )}

      {currentPhase === "choice-trials-images-interval" && <InterConditionInterval onComplete={advancePhase} />}

      {currentPhase === "first-desc-choice" && (
        <FirstDescChoice
          onAdvance={advancePhase}
          addTrialData={addTrialData}
        />
      )}

      {currentPhase === "first-desc-choice-interval" && <InterConditionInterval onComplete={advancePhase} />}

      {currentPhase === "forced-blue-and-orange" && (
        <ForcedBlueAndOrange 
          onAdvance={advancePhase} 
          addTrialData={addTrialData}
          setExperimentData={setExperimentData}
          experimentData={experimentData}
        />
      )}

      {currentPhase === "forced-blue-and-orange-interval" && <InterConditionInterval onComplete={advancePhase} />}

      {currentPhase === "blue-orange-trials" && (
        <BlueOrangeTrials 
          onAdvance={advancePhase} 
          addTrialData={addTrialData} 
        />
      )}

      {currentPhase === "blue-orange-trials-interval" && <InterConditionInterval onComplete={advancePhase} />}

      {currentPhase === "final-choice-blue-orange" && (
        <FinalChoiceBlueOrange
          onAdvance={advancePhase}
          addTrialData={addTrialData}
        />
      )}

      {currentPhase === "final-choice-blue-orange-interval" && <InterConditionInterval onComplete={advancePhase} />}

      {currentPhase === "second-desc-choice" && (
        <SecondDescChoice
          onAdvance={advancePhase}
          addTrialData={addTrialData}
        />
      )}

      {currentPhase === "second-desc-choice-interval" && <InterConditionInterval onComplete={advancePhase} />}

      {currentPhase === "final-survey" && (
        <FinalSurvey
          onComplete={() => {
            onComplete?.()
          }}
          addTrialData={addTrialData}
        />
      )}

      {currentPhase === "completion" && <CompletionPage />}
    </div>
  )
}
