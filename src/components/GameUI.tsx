import { P2_CONTROL_OPTIONS } from '../game/ai'
import { STAGE_OPTIONS } from '../game/stages'
import { getFighterVisualState, getSpriteAnimation, SPRITE_FIGHTERS } from '../game/spriteFighters'
import type { PlayerId } from '../game/types'
import { useGameStore } from '../store/gameStore'
import { CharacterSelect } from './CharacterSelect'
import { AudioController } from './AudioController'
import { UiAtlasSprite } from './UiAtlasSprite'

const HealthBar = ({ player }: { player: 'p1' | 'p2' }) => {
  const name = useGameStore((state) => state.fighters[player].name)
  const health = useGameStore((state) => state.fighters[player].health)
  const meter = useGameStore((state) => state.fighters[player].meter)
  const specialMove = useGameStore((state) => state.fighters[player].specialMove)
  const spriteDiagnostic = useGameStore((state) => state.spriteDiagnostics[player])
  const status = useGameStore((state) => {
    const fighter = state.fighters[player]
    return fighter.blocking ? 'GUARD' : fighter.hitStun > 0 ? 'STUN' : fighter.cooldown > 0 ? 'RECOVER' : 'READY'
  })
  return (
    <div className={`fighter-hud fighter-hud--${player}`}>
      <div className="fighter-hud__name">
        <span>{player.toUpperCase()}</span>
        {name}
      </div>
      <div className="arcade-health-shell">
        <UiAtlasSprite region={`hud-${player}`} />
        <div className="health-frame">
          <div className="health-fill" style={{ width: `${health}%` }} />
          <div className="health-chip" style={{ width: `${100 - health}%` }} />
          <div className="health-frame__shine" />
          <div className="health-frame__ticks" />
        </div>
      </div>
      <div className="fighter-hud__meta">
        <span>{health.toString().padStart(3, '0')}</span>
        <i>{status}</i>
      </div>
      <div className="meter-frame">
        <div className="meter-fill" style={{ width: `${meter}%` }} />
        <b>{specialMove}</b>
      </div>
      <div className={`fighter-sprite-status fighter-sprite-status--${spriteDiagnostic.status}`}>
        SPRITE {spriteDiagnostic.status === 'error' ? `FALLBACK // ${spriteDiagnostic.animation}` : spriteDiagnostic.status.toUpperCase()}
      </div>
    </div>
  )
}

const ControlColumn = ({
  side,
  rows,
}: {
  side: string
  rows: [string, string][]
}) => (
  <div className="control-column">
    <h4>{side}</h4>
    {rows.map(([key, move]) => (
      <p key={key}>
        <kbd>{key}</kbd>
        <span>{move}</span>
      </p>
    ))}
  </div>
)

const StageSelect = () => {
  const selectedStageId = useGameStore((state) => state.selectedStageId)
  const setSelectedStageId = useGameStore((state) => state.setSelectedStageId)

  return (
    <section className="stage-select">
      <div>
        <span className="eyebrow">STAGE SELECT</span>
        <h3>Choose the battleground.</h3>
      </div>
      <div className="stage-select__grid">
        {STAGE_OPTIONS.map((stage) => (
          <button
            className={`stage-choice ${selectedStageId === stage.id ? 'stage-choice--active' : ''}`}
            key={stage.id}
            type="button"
            onClick={() => setSelectedStageId(stage.id)}
          >
            {stage.previewThumbnail ? (
              <img src={stage.previewThumbnail} alt="" />
            ) : (
              <span className="stage-choice__fallback">3D</span>
            )}
            <strong>{stage.name}</strong>
            <small>{stage.artEnabled ? 'LAYERED ART' : 'PROCEDURAL FALLBACK'}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

const FighterVisualDebug = ({ id }: { id: PlayerId }) => {
  const fighter = useGameStore((state) => state.fighters[id])
  const spriteDiagnostic = useGameStore((state) => state.spriteDiagnostics[id])
  const animationName = getSpriteAnimation(fighter)
  const animation = SPRITE_FIGHTERS[fighter.spriteFighterId].animations[animationName]

  return (
    <div>
      <b>{id.toUpperCase()}</b>
      <span>{getFighterVisualState(fighter)}</span>
      <span>{animationName} // {animation.frameCount} frames</span>
      {spriteDiagnostic.status === 'error' && <em>FALLBACK // missing {spriteDiagnostic.animation}.png</em>}
    </div>
  )
}

const FighterDebugOverlay = () => {
  const phase = useGameStore((state) => state.phase)
  const p2ControlMode = useGameStore((state) => state.p2ControlMode)
  const p2ControlLabel = P2_CONTROL_OPTIONS.find((option) => option.mode === p2ControlMode)?.label ?? p2ControlMode
  if (phase !== 'fight' && phase !== 'paused') return null

  return (
    <aside className="fighter-visual-debug">
      <strong>SPRITE RENDERER // P2 {p2ControlLabel}</strong>
      <FighterVisualDebug id="p1" />
      <FighterVisualDebug id="p2" />
    </aside>
  )
}

const TitleScreen = () => {
  const startMatch = useGameStore((state) => state.startMatch)
  const p2ControlMode = useGameStore((state) => state.p2ControlMode)
  const p2ControlLabel = P2_CONTROL_OPTIONS.find((option) => option.mode === p2ControlMode)?.label ?? p2ControlMode
  return (
    <div className="overlay overlay--title">
      <div className="title-card">
        <span className="eyebrow">APE DISTRICT // NIGHT MARKET</span>
        <h1>
          APE
          <strong>FIGHTER</strong>
        </h1>
        <p className="title-card__tagline">SPRITE FIGHTERS. HEAVY HITS. ONE ROUND.</p>
        <div className="title-card__actions">
          <button className="primary-button" onClick={startMatch}>
            ENTER THE ARENA
          </button>
        </div>
        <p className="title-card__space">PRESS SPACE TO START</p>
      </div>
      <div className="setup-dock">
        <div className="controls-panel">
          <div>
            <span className="eyebrow">KEYBOARD MATCHUP</span>
            <h3>Two players. One keyboard.</h3>
          </div>
          <div className="controls-grid">
            <ControlColumn
              side="PLAYER 1"
              rows={[
                ['A / D', 'WALK'],
                ['W / S', 'JUMP / BLOCK'],
                ['Q', 'DASH'],
                ['F G H R', 'PUNCH / HEAVY / KICK / SPECIAL'],
              ]}
            />
            <ControlColumn
              side={`PLAYER 2 // ${p2ControlLabel}`}
              rows={[
                ['← / →', 'WALK'],
                ['↑ / ↓', 'JUMP / BLOCK'],
                ['/', 'DASH'],
                ['J K L I', 'PUNCH / HEAVY / KICK / SPECIAL'],
              ]}
            />
          </div>
        </div>
        <StageSelect />
        <CharacterSelect />
      </div>
    </div>
  )
}

const KoScreen = () => {
  const winner = useGameStore((state) => state.winner)
  const winnerName = useGameStore((state) => (winner ? state.fighters[winner].name : 'DRAW'))
  const rematch = useGameStore((state) => state.rematch)
  const perfect = useGameStore((state) => state.perfect)
  const returnToTitle = useGameStore((state) => state.returnToTitle)

  return (
    <div className="overlay overlay--ko">
      <div className="ko-card">
        <UiAtlasSprite region="panel" />
        <UiAtlasSprite region="ko" />
        <span className="ko-word">K.O.</span>
        {perfect && <strong className="perfect-word">PERFECT</strong>}
        <span className="eyebrow">{winner ? 'WINNER' : 'EVEN MATCH'}</span>
        <h2>{winnerName}</h2>
        {winner && <UiAtlasSprite region={winner === 'p1' ? 'win-p1' : 'win-p2'} />}
        <p className={`victory-word ${winner ? 'victory-word--win' : ''}`}>{winner ? 'WIN' : 'DRAW'}</p>
        <div className="overlay-actions">
          <button className="primary-button" onClick={rematch}>
            RUN IT BACK
          </button>
          <button className="secondary-button" onClick={returnToTitle}>
            CHARACTER SELECT
          </button>
        </div>
      </div>
    </div>
  )
}

const PauseScreen = () => {
  const togglePause = useGameStore((state) => state.togglePause)
  const restartMatch = useGameStore((state) => state.restartMatch)
  const returnToTitle = useGameStore((state) => state.returnToTitle)

  return (
    <div className="overlay overlay--pause">
      <div className="pause-card">
        <UiAtlasSprite region="panel" />
        <span className="eyebrow">MATCH PAUSED</span>
        <h2>PAUSE</h2>
        <p>Take a breath. Press <kbd>ESC</kbd> when both players are ready.</p>
        <div className="pause-card__rule" />
        <div className="overlay-actions">
          <button className="primary-button" onClick={togglePause}>RESUME</button>
          <button className="secondary-button" onClick={restartMatch}>RESTART ROUND</button>
          <button className="secondary-button" onClick={returnToTitle}>CHARACTER SELECT</button>
        </div>
      </div>
    </div>
  )
}

export const GameUI = () => {
  const phase = useGameStore((state) => state.phase)
  const timer = useGameStore((state) => Math.ceil(state.timer))
  const impactFlash = useGameStore((state) => state.shake > 0.25)
  const debugHitboxes = useGameStore((state) => state.debugHitboxes)
  const roundCallout = useGameStore((state) =>
    state.phase === 'fight' && state.roundIntro > 0 ? (state.roundIntro > 0.82 ? 'ROUND 1' : 'FIGHT!') : null,
  )
  const soundEnabled = useGameStore((state) => state.soundEnabled)
  const toggleSound = useGameStore((state) => state.toggleSound)
  const togglePause = useGameStore((state) => state.togglePause)

  return (
    <>
      <AudioController />
      <header className="hud">
        <HealthBar player="p1" />
        <div className="round-clock">
          <span>ROUND 01</span>
          <b>{timer.toString().padStart(2, '0')}</b>
        </div>
        <HealthBar player="p2" />
      </header>
      <div className={`impact-flash ${impactFlash ? 'impact-flash--active' : ''}`} />
      <div className="debug-note">
        <kbd>B</kbd> HITBOXES {debugHitboxes ? 'ON' : 'OFF'}
      </div>
      <FighterDebugOverlay />
      <button className="sound-toggle" type="button" onClick={toggleSound}>
        SOUND {soundEnabled ? 'ON' : 'OFF'}
      </button>
      {phase === 'fight' && (
        <button className="pause-toggle" type="button" onClick={togglePause}>
          PAUSE <kbd>ESC</kbd>
        </button>
      )}
      {roundCallout && (
        <div className={`round-callout round-callout--${roundCallout === 'FIGHT!' ? 'fight' : 'round'}`}>
          <UiAtlasSprite region={roundCallout === 'FIGHT!' ? 'fight' : 'round'} />
          <span>{roundCallout}</span>
        </div>
      )}
      {phase === 'title' && <TitleScreen />}
      {phase === 'ko' && <KoScreen />}
      {phase === 'paused' && <PauseScreen />}
    </>
  )
}
