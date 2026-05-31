import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { CharacterSelect } from './CharacterSelect'
import { AudioController } from './AudioController'
import { UploadCharacterPage } from './UploadCharacterPage'

const HealthBar = ({ player }: { player: 'p1' | 'p2' }) => {
  const fighter = useGameStore((state) => state.fighters[player])
  return (
    <div className={`fighter-hud fighter-hud--${player}`}>
      <div className="fighter-hud__name">
        <span>{player.toUpperCase()}</span>
        {fighter.name}
      </div>
      <div className="health-frame">
        <div className="health-fill" style={{ width: `${fighter.health}%` }} />
        <div className="health-chip" style={{ width: `${100 - fighter.health}%` }} />
        <div className="health-frame__ticks" />
      </div>
      <div className="fighter-hud__meta">
        <span>{fighter.health.toString().padStart(3, '0')}</span>
        <i>{fighter.blocking ? 'GUARD' : fighter.hitStun > 0 ? 'STUN' : fighter.cooldown > 0 ? 'RECOVER' : 'READY'}</i>
      </div>
      <div className="meter-frame">
        <div className="meter-fill" style={{ width: `${fighter.meter}%` }} />
        <b>{fighter.specialMove}</b>
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

const TitleScreen = ({ onUpload }: { onUpload: () => void }) => {
  const startMatch = useGameStore((state) => state.startMatch)
  return (
    <div className="overlay overlay--title">
      <div className="title-card">
        <span className="eyebrow">APE DISTRICT // NIGHT MARKET</span>
        <h1>
          APE
          <strong>FIGHTER</strong>
        </h1>
        <p className="title-card__tagline">STATIC SKINS. HEAVY HITS. ONE ROUND.</p>
        <div className="title-card__actions">
          <button className="primary-button" onClick={startMatch}>
            ENTER THE ARENA
          </button>
          <button className="secondary-button" type="button" onClick={onUpload}>
            UPLOAD CHARACTER
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
              side="PLAYER 2"
              rows={[
                ['← / →', 'WALK'],
                ['↑ / ↓', 'JUMP / BLOCK'],
                ['/', 'DASH'],
                ['J K L I', 'PUNCH / HEAVY / KICK / SPECIAL'],
              ]}
            />
          </div>
        </div>
        <CharacterSelect />
      </div>
    </div>
  )
}

const KoScreen = () => {
  const winner = useGameStore((state) => state.winner)
  const winnerName = useGameStore((state) => (winner ? state.fighters[winner].name : 'NO ONE'))
  const rematch = useGameStore((state) => state.rematch)
  const perfect = useGameStore((state) => state.perfect)

  return (
    <div className="overlay overlay--ko">
      <div className="ko-card">
        <span className="ko-word">K.O.</span>
        {perfect && <strong className="perfect-word">PERFECT</strong>}
        <span className="eyebrow">WINNER</span>
        <h2>{winnerName}</h2>
        <p className="victory-word">VICTORY</p>
        <button className="primary-button" onClick={rematch}>
          RUN IT BACK
        </button>
      </div>
    </div>
  )
}

export const GameUI = () => {
  const [screen, setScreen] = useState<'game' | 'upload'>('game')
  const phase = useGameStore((state) => state.phase)
  const timer = useGameStore((state) => state.timer)
  const shake = useGameStore((state) => state.shake)
  const debugHitboxes = useGameStore((state) => state.debugHitboxes)
  const roundIntro = useGameStore((state) => state.roundIntro)
  const soundEnabled = useGameStore((state) => state.soundEnabled)
  const toggleSound = useGameStore((state) => state.toggleSound)

  return (
    <>
      <AudioController />
      <header className="hud">
        <HealthBar player="p1" />
        <div className="round-clock">
          <span>ROUND 01</span>
          <b>{Math.ceil(timer).toString().padStart(2, '0')}</b>
        </div>
        <HealthBar player="p2" />
      </header>
      <div className={`impact-flash ${shake > 0.25 ? 'impact-flash--active' : ''}`} />
      <div className="debug-note">
        <kbd>B</kbd> HITBOXES {debugHitboxes ? 'ON' : 'OFF'}
      </div>
      <button className="sound-toggle" type="button" onClick={toggleSound}>
        SOUND {soundEnabled ? 'ON' : 'OFF'}
      </button>
      {phase === 'fight' && roundIntro > 0 && (
        <div className="round-callout">
          <span>{roundIntro > 0.82 ? 'ROUND 1' : 'FIGHT!'}</span>
        </div>
      )}
      {phase === 'title' && screen === 'game' && <TitleScreen onUpload={() => setScreen('upload')} />}
      {phase === 'title' && screen === 'upload' && <UploadCharacterPage onClose={() => setScreen('game')} />}
      {phase === 'ko' && <KoScreen />}
    </>
  )
}
