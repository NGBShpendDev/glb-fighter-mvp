import { useEffect, useRef } from 'react'
import type { AttackType } from '../game/types'
import { useGameStore } from '../store/gameStore'

const playTone = (
  context: AudioContext,
  frequency: number,
  duration: number,
  gain: number,
  type: OscillatorType,
  offset = 0,
) => {
  const oscillator = context.createOscillator()
  const volume = context.createGain()
  const start = context.currentTime + offset
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(36, frequency * 0.55), start + duration)
  volume.gain.setValueAtTime(0.0001, start)
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.012)
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(volume)
  volume.connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

const playImpact = (context: AudioContext, kind: AttackType, blocked: boolean) => {
  if (blocked) {
    playTone(context, 420, 0.09, 0.07, 'square')
    return
  }

  const frequency = kind === 'special' ? 145 : kind === 'heavy' ? 92 : kind === 'kick' ? 115 : 175
  const duration = kind === 'special' ? 0.34 : kind === 'heavy' ? 0.2 : 0.13
  playTone(context, frequency, duration, kind === 'special' ? 0.18 : 0.11, 'sawtooth')
  if (kind === 'special') playTone(context, 680, 0.42, 0.07, 'square', 0.03)
}

export const AudioController = () => {
  const context = useRef<AudioContext | null>(null)
  const musicTimer = useRef<number | null>(null)
  const beat = useRef(0)

  useEffect(() => {
    const stopMusic = () => {
      if (musicTimer.current !== null) window.clearInterval(musicTimer.current)
      musicTimer.current = null
    }

    const startMusic = () => {
      if (!context.current || musicTimer.current !== null || !useGameStore.getState().soundEnabled) return
      musicTimer.current = window.setInterval(() => {
        if (!context.current || useGameStore.getState().phase === 'title') return
        const notes = [55, 55, 65.41, 49]
        playTone(context.current, notes[beat.current % notes.length], 0.18, 0.035, 'triangle')
        if (beat.current % 2 === 0) playTone(context.current, 110, 0.05, 0.018, 'square', 0.12)
        beat.current += 1
      }, 440)
    }

    const enableAudio = () => {
      if (!context.current) context.current = new AudioContext()
      void context.current.resume()
      startMusic()
    }

    window.addEventListener('pointerdown', enableAudio)
    window.addEventListener('keydown', enableAudio)
    const unsubscribe = useGameStore.subscribe((state, previous) => {
      if (!context.current) return
      if (!state.soundEnabled) {
        stopMusic()
        void context.current.suspend()
        return
      }
      void context.current.resume()
      startMusic()
      if (state.sparks.length > previous.sparks.length) {
        const spark = state.sparks[state.sparks.length - 1]
        playImpact(context.current, spark.kind, spark.blocked)
      }
      if (state.roundIntro > 0 && previous.roundIntro === 0) {
        playTone(context.current, 220, 0.16, 0.055, 'square')
        playTone(context.current, 330, 0.18, 0.045, 'square', 0.18)
      }
      if (previous.roundIntro > 0.82 && state.roundIntro <= 0.82) {
        playTone(context.current, 520, 0.24, 0.085, 'sawtooth')
      }
      if (state.phase === 'ko' && previous.phase !== 'ko') {
        playTone(context.current, 165, 0.52, 0.13, 'sawtooth')
        playTone(context.current, 82, 0.7, 0.11, 'square', 0.1)
      }
    })

    return () => {
      unsubscribe()
      stopMusic()
      window.removeEventListener('pointerdown', enableAudio)
      window.removeEventListener('keydown', enableAudio)
      void context.current?.close()
    }
  }, [])

  return null
}
