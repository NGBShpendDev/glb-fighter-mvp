import { P2_CONTROL_OPTIONS } from '../game/ai'
import { countSpriteAnimationFallbacks, SPRITE_ANIMATION_NAMES, SPRITE_FIGHTER_OPTIONS } from '../game/spriteFighters'
import type { PlayerId, SpriteFighterId } from '../game/types'
import { useGameStore } from '../store/gameStore'
import { UiAtlasSprite } from './UiAtlasSprite'

const FighterPicker = ({ id }: { id: PlayerId }) => {
  const loadout = useGameStore((state) => state.loadout[id])
  const setFighterSprite = useGameStore((state) => state.setFighterSprite)
  const config = SPRITE_FIGHTER_OPTIONS.find((fighter) => fighter.id === loadout.spriteFighterId)!
  const fallbackCount = countSpriteAnimationFallbacks(config)
  const label = id === 'p1' ? 'FIGHTER 1' : 'FIGHTER 2'

  return (
    <article className={`fighter-picker fighter-picker--${id}`}>
      <UiAtlasSprite region="portrait" />
      <span className="fighter-picker__selected">{id === 'p1' ? 'P1 SELECTED' : 'P2 SELECTED'}</span>
      <div className="fighter-picker__topline">
        <span className="eyebrow">{label}</span>
        <strong>{loadout.name}</strong>
      </div>
      <div className="fighter-picker__portrait">
        {config.portraitPath || config.anchorPath ? (
          <img src={config.portraitPath ?? config.anchorPath} alt={`${config.name} portrait`} />
        ) : (
          <span>SPRITE</span>
        )}
      </div>
      <label className="sprite-choice">
        <span>SPRITE FIGHTER</span>
        <select
          value={loadout.spriteFighterId}
          onChange={(event) => setFighterSprite(id, event.target.value as SpriteFighterId)}
        >
          {SPRITE_FIGHTER_OPTIONS.map((fighter) => (
            <option key={fighter.id} value={fighter.id}>
              {fighter.name}
            </option>
          ))}
        </select>
      </label>
      <div className="fighter-stats">
        <span>POW <b>{loadout.stats.power}</b></span>
        <span>SPD <b>{loadout.stats.speed}</b></span>
        <span>DEF <b>{loadout.stats.defense}</b></span>
      </div>
      <div className="fighter-special">{loadout.specialMove}</div>
      <p className="sprite-asset-summary">
        {SPRITE_ANIMATION_NAMES.length} ANIMATION SLOTS // {fallbackCount} SAFE FALLBACKS
      </p>
    </article>
  )
}

const P2ControlSelect = () => {
  const p2ControlMode = useGameStore((state) => state.p2ControlMode)
  const setP2ControlMode = useGameStore((state) => state.setP2ControlMode)
  const selected = P2_CONTROL_OPTIONS.find((option) => option.mode === p2ControlMode)!

  return (
    <section className="p2-control-select">
      <div>
        <span className="eyebrow">PLAYER 2 CONTROL</span>
        <h4>{selected.label}</h4>
        <p>{selected.description}</p>
      </div>
      <select value={p2ControlMode} onChange={(event) => setP2ControlMode(event.target.value as typeof p2ControlMode)}>
        {P2_CONTROL_OPTIONS.map((option) => (
          <option key={option.mode} value={option.mode}>
            {option.label}
          </option>
        ))}
      </select>
    </section>
  )
}

export const CharacterSelect = () => (
  <section className="character-select">
    <div className="character-select__heading">
      <span className="eyebrow">CHARACTER SELECT // SPRITE ROSTER</span>
      <h3>Choose your fighters</h3>
      <p>Portrait-driven sprite fighters with lightweight animation fallbacks.</p>
    </div>
    <div className="fighter-picker-grid">
      <FighterPicker id="p1" />
      <FighterPicker id="p2" />
    </div>
    <P2ControlSelect />
  </section>
)
