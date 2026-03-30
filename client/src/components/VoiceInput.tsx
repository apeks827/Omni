import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Stack, Text } from '../design-system'
import { colors, spacing } from '../design-system/tokens'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
  language?: string
}

interface SpeechRecognitionType {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: () => void
  onresult: (event: SpeechRecognitionEventType) => void
  onerror: (event: SpeechRecognitionErrorEventType) => void
  onend: () => void
  start: () => void
  stop: () => void
}

interface SpeechRecognitionEventType {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: {
        transcript: string
      }
    }
  }
}

interface SpeechRecognitionErrorEventType {
  error: string
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onError,
  language = 'en-US',
}) => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognitionType | null>(null)

  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (
            window as typeof globalThis & {
              SpeechRecognition?: new () => SpeechRecognitionType
              webkitSpeechRecognition?: new () => SpeechRecognitionType
            }
          ).SpeechRecognition ||
          (
            window as typeof globalThis & {
              SpeechRecognition?: new () => SpeechRecognitionType
              webkitSpeechRecognition?: new () => SpeechRecognitionType
            }
          ).webkitSpeechRecognition
        : undefined

    if (!SpeechRecognitionAPI) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = language

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
    }

    recognition.onresult = (event: SpeechRecognitionEventType) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece
        } else {
          interimTranscript += transcriptPiece
        }
      }

      const currentTranscript = finalTranscript || interimTranscript
      setTranscript(currentTranscript)

      if (finalTranscript) {
        onTranscript(finalTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEventType) => {
      setIsListening(false)
      const errorMessage = `Speech recognition error: ${event.error}`
      if (onError) {
        onError(errorMessage)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [language, onTranscript, onError])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch {
        if (onError) {
          onError('Failed to start speech recognition')
        }
      }
    }
  }, [isListening, onError])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  if (!isSupported) {
    return (
      <Text
        variant="body"
        style={{ color: colors.gray600, fontSize: '0.875rem' }}
      >
        Voice input not supported in this browser
      </Text>
    )
  }

  return (
    <Stack direction="vertical" spacing="sm">
      <Button
        variant={isListening ? 'danger' : 'primary'}
        size="md"
        onClick={isListening ? stopListening : startListening}
        leftIcon={
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 1a2 2 0 0 0-2 2v5a2 2 0 0 0 4 0V3a2 2 0 0 0-2-2zm0 10a4 4 0 0 1-4-4H3a5 5 0 0 0 4.5 4.975V14h-2v1h5v-1h-2v-2.025A5 5 0 0 0 13 7h-1a4 4 0 0 1-4 4z" />
          </svg>
        }
        aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? 'Stop' : 'Voice Input'}
      </Button>

      {isListening && (
        <Stack direction="horizontal" spacing="xs" align="center">
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: colors.danger,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <Text
            variant="body"
            style={{ fontSize: '0.875rem', color: colors.gray600 }}
          >
            Listening...
          </Text>
        </Stack>
      )}

      {transcript && (
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.gray100,
            borderRadius: '8px',
            border: `1px solid ${colors.gray200}`,
          }}
        >
          <Text
            variant="body"
            style={{ fontSize: '0.875rem', fontStyle: 'italic' }}
          >
            {transcript}
          </Text>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}
      </style>
    </Stack>
  )
}

export default VoiceInput
