import { useState } from 'react'

const UI_ATLAS_PATH = '/assets/ui/arcade-ui-atlas.png'

export type UiAtlasRegion =
  | 'hud-p1'
  | 'hud-p2'
  | 'fight'
  | 'ko'
  | 'round'
  | 'win-p1'
  | 'win-p2'
  | 'panel'
  | 'portrait'

export const UiAtlasSprite = ({
  className = '',
  region,
}: {
  className?: string
  region: UiAtlasRegion
}) => {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <>
      {!failed && (
        <img
          className="ui-atlas-preload"
          src={UI_ATLAS_PATH}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      {loaded && !failed && (
        <span
          aria-hidden="true"
          className={`ui-atlas-sprite ui-atlas-sprite--${region} ${className}`}
        />
      )}
    </>
  )
}
