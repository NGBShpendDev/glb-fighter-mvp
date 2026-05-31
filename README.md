# Ape Fighter

A browser-based 2.5D sprite fighting game MVP built with Vite, React, TypeScript, Three.js, React Three Fiber, and Zustand.

The game is sprite-only. Gameplay logic, invisible hitboxes, movement, AI, and visual sprite playback stay separate so the project remains easy to tune.

## Features

- Two selectable sprite fighters with horizontal flipping so opponents face each other
- 2.5D side-view arena with a layered custom street stage and procedural fallback stage
- Player 1 keyboard controls and configurable Player 2 AI or keyboard control
- Walk, jump, dash, block, light punch, heavy punch, kick, and meter-backed special attacks
- Health bars, round timer, hit stun, block stun, knockback, KO, pause, restart, and rematch
- Sprite-sheet VFX for hit sparks, block sparks, dust puffs, and energy slashes
- Screen shake, hit stop, KO slow motion, stage parallax, and CSS-first arcade UI
- Generated fallback silhouettes when optional fighter sheets fail to load

## Local Development

Install dependencies and start the game:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Run the automated checks and production build:

```bash
npm run test:game
npm run test:sprites
npm run build
```

`npm run test:game` verifies arena bounds, movement, jumping, dashing, blocking, hits, VFX, KO, pause, rematch, draws, and every Player 2 control mode.

`npm run test:sprites` verifies sprite folders, required animation configs, PNG files, frame counts, public asset URLs, and visual-state animation mapping.

## Controls

| Action | Player 1 | Player 2 when Player Controlled |
| --- | --- | --- |
| Walk | `A` / `D` | Left / Right arrows |
| Jump | `W` | Up arrow |
| Block | `S` | Down arrow |
| Dash | `Q` | `/` |
| Light punch | `F` | `J` |
| Heavy punch | `G` | `K` |
| Kick | `H` | `L` |
| Special | `R` | `I` |
| Toggle hitboxes | `B` | `B` |
| Pause / resume | `Esc` | `Esc` |

## Player 2 Modes

Choose Player 2 behavior on the character select screen:

- `AI EASY`: slower reactions, fewer blocks, mistakes, and visible openings.
- `AI MEDIUM`: better spacing, more intentional attacks, and occasional defense.
- `AI HARD`: faster pressure, stronger spacing, and more frequent blocking.
- `PLAYER CONTROLLED`: enables the Player 2 keyboard controls.

AI settings live in `src/game/ai.ts`. The AI produces the same movement, jump, block, light-punch, and kick inputs used by a human player. It does not change health directly or bypass hitboxes.

## Project Structure

```text
src/
  components/
    Arena.tsx                 # Procedural fallback stage
    CharacterSelect.tsx       # Sprite roster and Player 2 mode selector
    FighterController.tsx     # Visual shell attached to gameplay state
    GameScene.tsx             # Match loop, camera, controls, sparks
    GameUI.tsx                # HUD, title, pause, KO, and debug UI
    StageManager.tsx          # Config-driven stage art and parallax
    VFXManager.tsx            # Capped sprite-sheet VFX renderer
    fighters/
      FighterRenderer.tsx     # Sprite-only fighter renderer
      SpriteFighter.tsx       # Sprite playback and safe silhouette fallback
  game/
    ai.ts                     # Player 2 AI difficulties and decisions
    constants.ts              # Controls and move tuning
    hitboxes.ts               # Invisible collision boxes
    spriteFighters.ts         # Fighter sheet paths, frame counts, FPS, tuning
    stages.ts                 # Stage asset catalog
    types.ts                  # Gameplay contracts
    vfx.ts                    # VFX sheet config
  store/
    gameStore.ts              # Zustand match state and simulation

public/assets/
  fighters/
  stages/
  ui/
  vfx/
  audio/
```

## Adding Sprite Fighters

Create a folder under `public/assets/fighters/`:

```text
public/assets/fighters/my-fighter/
  anchor.png
  idle.png
  walk.png
  jump.png
  block.png
  light-punch.png
  kick.png
  hit.png
  ko.png
  victory.png
```

`anchor.png` is the portrait shown on the character select screen. Animation PNGs should contain one horizontal row of equal-width frames.

The engine also supports optional `heavy-punch.png` and `special.png` sheets. Until those exist, configure `fallbackAnimation` to reuse a nearby move.

Add the fighter ID to `SpriteFighterId` in `src/game/types.ts`, then add its config in `src/game/spriteFighters.ts`:

```ts
{
  id: 'my-fighter',
  name: 'MY FIGHTER',
  scale: 3.05,
  horizontalOffset: 0,
  verticalOffset: 0,
  anchorPath: '/assets/fighters/my-fighter/anchor.png',
  animations: {
    idle: {
      filePath: '/assets/fighters/my-fighter/idle.png',
      frameCount: 4,
      fps: 7,
      loop: true,
    },
  },
}
```

Frame width is inferred from image width divided by `frameCount`; frame height is read from the image. Use per-animation `scale`, `horizontalOffset`, and `verticalOffset` only when a sheet needs small visual alignment corrections.

## Existing Fighters

- `SAFARI STRIKER`: `public/assets/fighters/fighter-1/`
- `CRIMSON RIOT`: `public/assets/fighters/fighter-2/`

Both currently reuse their nearest completed sheet for heavy punch and special animation visuals. Combat timing and hitboxes remain distinct.

## Stage And VFX Assets

The custom stage lives at:

```text
public/assets/stages/street-alley/
```

Stage settings live in `src/game/stages.ts`. Missing required stage images fall back to the procedural arena.

VFX sheets live at:

```text
public/assets/vfx/
  hit-sparks.png
  dust-puff.png
  energy-slash.png
```

VFX timing, sheet grids, sizes, and lifetimes live in `src/game/vfx.ts`. Missing VFX images are skipped without interrupting the match.

## Vercel Deployment

1. Push the project to a Git provider.
2. Import the repository in Vercel.
3. Keep the default Vite settings:

```text
Build command: npm run build
Output directory: dist
```

The game deploys as a static Vite app with no server routes or cloud storage requirements.

## Manual Browser Checklist

- Select each sprite fighter for Player 1 and Player 2.
- Start a match and test walking, jumping, dashing, blocking, and all four attacks.
- Confirm fighters flip horizontally to face each other when crossing positions.
- Confirm hit sparks, block sparks, dust puffs, heavy/special slashes, shake, and KO slow motion.
- Select `AI EASY`; confirm slow reactions and visible openings.
- Select `AI MEDIUM`; confirm more deliberate spacing and occasional blocks.
- Select `AI HARD`; confirm faster pressure without direct health changes.
- Select `PLAYER CONTROLLED`; confirm Player 2 arrow and `J K L I /` controls.
- Pause with `Esc`, restart the round, return to character select, and rematch after KO.
- Toggle hitboxes with `B` and confirm sprite animation does not affect collision boxes.
