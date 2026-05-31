import { useCallback, useEffect } from 'react'
import { resolveSpriteAnimations, SPRITE_FIGHTERS } from '../../game/spriteFighters'
import type { PlayerId, SpriteAssetDiagnostic } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { SpriteFighter } from './SpriteFighter'
import { preloadSafeTextures } from '../assets/useSafeTexture'

export const FighterRenderer = ({ id }: { id: PlayerId }) => {
  const spriteFighterId = useGameStore((state) => state.fighters[id].spriteFighterId)
  const accent = useGameStore((state) => state.fighters[id].accent)
  const setSpriteDiagnostic = useGameStore((state) => state.setSpriteDiagnostic)
  const reportSpriteStatus = useCallback(
    (diagnostic: SpriteAssetDiagnostic) => setSpriteDiagnostic(id, diagnostic),
    [id, setSpriteDiagnostic],
  )

  useEffect(() => {
    const animations = resolveSpriteAnimations(SPRITE_FIGHTERS[spriteFighterId])
    preloadSafeTextures([...new Set(Object.values(animations).map((animation) => animation.file))])
  }, [spriteFighterId])

  return (
    <SpriteFighter
      key={spriteFighterId}
      id={id}
      config={SPRITE_FIGHTERS[spriteFighterId]}
      accent={accent}
      onStatus={reportSpriteStatus}
    />
  )
}
