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
npm run audit:sprites
npm run build
```

`npm run test:game` verifies arena bounds, movement, jumping, dashing, blocking, hits, VFX, KO, pause, rematch, draws, and every Player 2 control mode.

`npm run test:sprites` verifies sprite folders, required animation configs, PNG files, frame counts, public asset URLs, and visual-state animation mapping.

`npm run audit:sprites` prints a repeatable fighter-by-fighter asset report: present and missing files, broken config references, unused PNGs, non-integer frame widths, and likely baked checkerboard backgrounds. If a generated sheet accidentally includes a neutral checkerboard background, run `npm run clean:sprite-backgrounds`, inspect the result, and rerun the audit.

The cleanup command converts border-connected neutral checkerboard pixels into real PNG alpha. It intentionally does not erase painted or gradient backdrops because those should be re-exported from the source art.

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
    spriteAnimator.ts         # Frame playback, priorities, events, cancellation
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
  portrait.png
  idle.png
  walk.png
  dash.png
  jump.png
  block.png
  light-punch.png
  heavy-punch.png
  kick.png
  special.png
  hit.png
  knockdown.png
  ko.png
  victory.png
```

`anchor.png` is the full-body alignment reference. `portrait.png` is the preferred character-select image; when it is absent, the UI safely uses `anchor.png`. Animation PNGs should use transparent backgrounds and contain one horizontal row of equal-width frames.

For new art, use `512x512` pixels per frame. An 8-frame sheet should be exported as a `4096x512` PNG. Keep the fighter's feet on the same baseline in every grounded frame so animation changes do not create visible jitter.

Required animations:

| Animation | Recommended frames |
| --- | ---: |
| `idle` | 8 |
| `walk` | 8 |
| `jump` | 6 |
| `block` | 4 |
| `lightPunch` | 6 |
| `kick` | 7 |
| `hit` | 4 |
| `ko` | 6 |
| `victory` | 6 |

Recommended upgraded animations:

| Animation | Recommended frames | Safe visual fallback |
| --- | ---: | --- |
| `dash` | 5 | `walk` |
| `heavyPunch` | 7 | `lightPunch` |
| `special` | 8 | `kick` |
| `knockdown` | 6 | `ko` |

Missing optional animations are resolved automatically. Gameplay movement, attack timing, damage, and invisible hitboxes remain separate from the visible fallback sheet.

Add the fighter ID to `SpriteFighterId` in `src/game/types.ts`, then add its config in `src/game/spriteFighters.ts`:

```ts
{
  id: 'my-fighter',
  name: 'MY FIGHTER',
  sourceFacing: 1,
  scale: 3.05,
  horizontalOffset: 0,
  verticalOffset: 0,
  originX: 0.5,
  originY: 0,
  anchorPath: '/assets/fighters/my-fighter/anchor.png',
  animations: {
    idle: {
      file: '/assets/fighters/my-fighter/idle.png',
      frameCount: 4,
      fps: 7,
      loop: true,
      holdLastFrame: false,
      restartOnEnter: true,
      priority: 10,
      cancelWindows: [],
      frameEvents: [],
    },
  },
}
```

Frame width is inferred from image width divided by `frameCount`; frame height is read from the image. `originX: 0.5` and `originY: 0` keep the sprite pivot centered on its feet. Use per-animation `scale`, `offsetX`, `offsetY`, `originX`, and `originY` only when a sheet needs small visual alignment corrections.

Attack animations can also define `attackPhases`, `hitFrames`, and `soundEventFrame`. The engine builds frame events from this data, and invisible attack hitboxes are only active on configured hit frames. `cancelWindows` list the future animations that may interrupt a move during specific recovery frames.

Sprite sheets are preloaded when a fighter is selected. During a match, press `V` to open the lower-left debug panel. It reports the current state, animation, frame, FPS, velocity, facing direction, ground state, and combat flags. The same panel can pause animation playback, step forward by one frame, preview each animation, show sheet bounds, and draw the fighter baseline.

Read the full production checklist in [`docs/SPRITE_PRODUCTION_SPEC.md`](docs/SPRITE_PRODUCTION_SPEC.md). A copyable config with the complete upgraded animation set lives in [`docs/examples/upgraded-sprite-fighter.config.ts`](docs/examples/upgraded-sprite-fighter.config.ts).

## Existing Fighters

- `CHEETAH CHIEF`: `public/assets/fighters/fighter-1/`
- `PARTY BOT`: `public/assets/fighters/fighter-2/`

Both fighters include the full upgraded sprite set: portrait, dash, heavy punch, special, and knockdown. Combat timing and hitboxes remain distinct.

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
- Toggle the sprite diagnostics with `V` and confirm frame, velocity, facing, and state values respond during a match.
