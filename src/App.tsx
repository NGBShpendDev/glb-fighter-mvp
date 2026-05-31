import { GameScene } from './components/GameScene'
import { GameUI } from './components/GameUI'

export const App = () => (
  <main className="game-shell">
    <GameScene />
    <GameUI />
  </main>
)
