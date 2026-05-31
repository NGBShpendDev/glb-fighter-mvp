import { useCallback } from 'react'
import { SPRITE_FIGHTERS } from '../../game/spriteFighters'
import type { ModelDiagnostic, PlayerId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { GlbModel } from '../models/GlbModel'
import { SpriteFighter } from './SpriteFighter'

export const FighterRenderer = ({ id }: { id: PlayerId }) => {
  const mode = useGameStore((state) => state.fighterRenderMode)
  const modelUrl = useGameStore((state) => state.fighters[id].modelUrl)
  const spriteFighterId = useGameStore((state) => state.fighters[id].spriteFighterId)
  const modelScale = useGameStore((state) => state.fighters[id].modelSettings.scale)
  const accent = useGameStore((state) => state.fighters[id].accent)
  const setModelDiagnostic = useGameStore((state) => state.setModelDiagnostic)
  const reportModelStatus = useCallback(
    (diagnostic: ModelDiagnostic) => setModelDiagnostic(id, diagnostic),
    [id, setModelDiagnostic],
  )

  if (mode === 'sprite') {
    return <SpriteFighter id={id} config={SPRITE_FIGHTERS[spriteFighterId]} accent={accent} />
  }

  return (
    <GlbModel
      modelUrl={modelUrl}
      scale={modelScale}
      accent={accent}
      onStatus={reportModelStatus}
    />
  )
}
