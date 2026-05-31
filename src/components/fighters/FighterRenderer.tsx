import { useCallback } from 'react'
import { SPRITE_FIGHTERS } from '../../game/spriteFighters'
import type { PlayerId, SpriteAssetDiagnostic } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { SpriteFighter } from './SpriteFighter'

export const FighterRenderer = ({ id }: { id: PlayerId }) => {
  const spriteFighterId = useGameStore((state) => state.fighters[id].spriteFighterId)
  const accent = useGameStore((state) => state.fighters[id].accent)
  const setSpriteDiagnostic = useGameStore((state) => state.setSpriteDiagnostic)
  const reportSpriteStatus = useCallback(
    (diagnostic: SpriteAssetDiagnostic) => setSpriteDiagnostic(id, diagnostic),
    [id, setSpriteDiagnostic],
  )

  return (
    <SpriteFighter
      id={id}
      config={SPRITE_FIGHTERS[spriteFighterId]}
      accent={accent}
      onStatus={reportSpriteStatus}
    />
  )
}
