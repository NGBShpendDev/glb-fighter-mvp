# Ape Fighter

A browser-based 2.5D local multiplayer fighting game MVP built with Vite, React, TypeScript, Three.js, React Three Fiber, Drei, and Zustand.

The game supports hybrid fighter visuals. Static GLBs remain useful for identity, preview, tuning, and uploads. Matches can render those GLBs or switch to sprite-sheet fighters without changing movement, combat, or hitboxes.

## Features

- 2.5D side-view arena with fighters locked to the X/Y plane
- Expanded street-market arena with crowd silhouettes, stalls, neon lighting, and street reflections
- Camera tracking, shadows, hit-stop, stronger screen shake, layered sparks, rings, debris, and impact flashes
- Two keyboard-controlled fighters with walk, jump, dash, block, and four attacks
- Custom invisible hitbox and hurtbox collision logic with a `B` debug toggle
- Damage, knockback, hit stun, block stun, cooldowns, round timer, KO, and rematch
- Meter-backed special moves, fighter stats, round callouts, perfect wins, and victory presentation
- Procedural idle, attack lunge, kick spin, jump stretch, recoil squash, KO fall, and victory motion
- Generated Web Audio hit effects and a lightweight synth backing loop with a sound toggle
- Config-driven stage art pipeline with safe procedural fallbacks and optional parallax layers
- Drop-in transparent PNG overlays for impact, block, dust, special, and KO effects
- Uploaded `.glb` fighter skins with automatic height normalization and fallback meshes
- Local character-select screen with rotating GLB previews and per-fighter tuning
- Hybrid GLB or sprite-sheet match rendering with generated sprite fallbacks
- Vercel Blob character uploads with progress, validation, and browser-local metadata

## Local Development

Install dependencies and start the game:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Verify the production build before deploying:

```bash
npm run test:models
npm run test:game
npm run test:sprites
npm run build
```

`npm run test:models` verifies that the submitted fighter GLBs exist, use GLB version 2, contain scenes and meshes, and match their declared binary size.

`npm run test:game` runs a fast state-level combat smoke test for arena bounds, jumping, dashing, hits, blocking, KO, rematch, pause, and draw handling.

`npm run test:sprites` verifies the sprite folder structure, required animation configs, Vite asset paths, and visual-state animation mapping.

## Controls

| Action | Player 1 | Player 2 |
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

## Project Structure

```text
api/
  upload.ts                      # Vercel Blob client-upload token route
src/
  components/
    Arena.tsx                 # Urban Three.js stage
    StageManager.tsx          # Config-driven stage assets and fallback arena
    VFXManager.tsx            # Capped sprite-sheet event renderer
    FighterController.tsx     # Reusable visual fighter shell
    fighters/
      FighterRenderer.tsx     # GLB or sprite render-mode switch
      SpriteFighter.tsx       # One-row sprite-sheet playback and fallback
    GameScene.tsx             # Match loop, camera, controls, sparks
    GameUI.tsx                # HUD, title screen, KO flow
    UiAtlasSprite.tsx         # Optional generated arcade UI atlas crops
    CharacterSelect.tsx       # Local GLB selection and preview controls
    DebugModelViewer.tsx      # Standalone GLB diagnostics and tuning page
    UploadCharacterPage.tsx   # Vercel Blob upload screen
    models/
      GlbModel.tsx            # Shared safe loader, normalization, fallback
    assets/
      useSafeTexture.ts       # Safe image loading for optional stage art
  game/
    constants.ts              # Move tuning and controls
    hitboxes.ts               # Collision volumes and overlap checks
    models.ts                 # Bundled model paths and tuning defaults
    spriteFighters.ts         # Sprite paths, frame counts, FPS, and state mapping
    stages.ts                 # Stage catalog, layers, lighting, and music paths
    types.ts                  # Combat types
    vfx.ts                    # Drop-in transparent PNG effect paths
  store/
    gameStore.ts              # Zustand match state and simulation
```

## Vercel Deployment

1. Push the project to a Git provider.
2. Import the repository in Vercel.
3. In the Vercel project, create a public Blob store and connect it to the project.
4. Use the default Vite settings:

```text
Build command: npm run build
Output directory: dist
```

The fighting game is a static Vite app. Uploading characters adds one small Vercel Function for issuing Blob client-upload tokens.

The upload screen uses the Vercel Function at `api/upload.ts`. Vercel automatically provides `BLOB_READ_WRITE_TOKEN` after a Blob store is connected. Uploaded GLBs are public skins, limited to 50 MB, and their character metadata is saved in browser local storage.

The MVP upload route is intentionally unauthenticated. Add sign-in and authorization checks in `api/upload.ts` before exposing uploads to untrusted public traffic.

For local Blob upload testing, pull the linked environment variables and use Vercel's local runtime:

```bash
npx vercel env pull .env.local
npx vercel dev
```

Plain `npm run dev` still runs the playable game and bundled character select, but it does not emulate the `/api/upload` Vercel Function.

## Fighter Model Settings

The character-select screen offers a small bundled list that includes `public/models/fighter-1.glb` and `public/models/fighter-2.glb`. Selected skins are loaded through Drei's `useGLTF`, automatically normalized to a similar height, and replaced with a simple fallback mesh if loading fails.

Files inside Vite's `public/` folder are served from the site root. Use `/models/fighter-1.glb` in code for `public/models/fighter-1.glb`; do not include `public` in the browser URL.

Per-fighter visual tuning is stored locally in the Zustand game state:

```ts
{ scale: 1, rotationY: Math.PI / 2, verticalOffset: 0, horizontalOffset: 0 }
```

These values only adjust the visible skin. Movement, hitboxes, and hurtboxes remain locked to the 2.5D fighting plane.

The character-select cards expose sliders for scale, vertical offset, horizontal offset, and rotation. Use `RESET TUNING` to return a fighter to the recommended defaults.

## Debugging GLB Models

Open `DEBUG MODEL VIEWER` from the title screen to inspect `fighter-1.glb` and `fighter-2.glb` outside the match. The viewer shows:

- Loading, loaded, and error states
- Browser URL and matching `public/` file path
- Mesh and node counts
- Original model dimensions
- Automatic normalization scale
- Controls for scale, rotation Y, vertical offset, and horizontal offset

The browser console also logs `[GLB] loading`, `[GLB] loaded`, or `[GLB] failed` messages. During a match, each health bar shows the active fighter model status. If loading fails, the game uses a blocky fallback fighter instead of crashing.

## Adding Local GLB Models

For the simplest local workflow:

1. Copy a `.glb` file into `public/models/`.
2. Add a matching entry to `BUNDLED_MODELS` in `src/game/models.ts`.
3. Run `npm run dev`.
4. Select the new model, tune its sliders, and start a match.

Static, non-rigged GLBs are expected. The controller adds procedural motion around the model without requiring skeleton clips. If a model URL is missing or invalid, the game renders a blocky fallback fighter so the round remains playable.

## Adding Sprite Fighters

Use the `SPRITE MODE` button on the title screen to render flat 2.5D fighters during a match. `GLB MODE` keeps the original 3D match renderer available. The character-select preview and debug model viewer continue to use GLBs in both modes.

Drop one-row transparent PNG sheets into:

```text
public/assets/fighters/fighter-1/
public/assets/fighters/fighter-2/
```

Use these exact filenames:

```text
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

Each sheet contains one horizontal row of equal-sized frames. Configure the animation timing in `src/game/spriteFighters.ts`:

```ts
{
  scale: 2.8,
  horizontalOffset: 0,
  verticalOffset: 0,
  animations: {
    idle: { filePath: '/assets/fighters/fighter-1/idle.png', frameCount: 6, fps: 8, loop: true }
  }
}
```

By default, frame dimensions are inferred per animation: frame width is the full sheet width divided by `frameCount`, and frame height is the image height. Add optional `frameWidth` and `frameHeight` values only when a future sheet needs an explicit override. Missing or invalid sprite sheets automatically use a generated fallback silhouette, so sprite mode stays playable while artwork is in progress.

Fighter 1 is the included `SAFARI STRIKER` sprite skin. Its submitted files live in `public/assets/fighters/fighter-1/`, with `light-punch.png` using a hyphenated filename and `anchor.png` acting as a static alignment reference. The character-select cards include a `SPRITE SHEET FIGHTER` selector, so Safari Striker can be assigned to Player 1 or Player 2 independently of the GLB preview skin.

The current Safari Striker submission is still missing `kick.png`. Kick and special moves deliberately render the fallback silhouette until the five-frame kick sheet is added.

The debug panel shown during a match reports the active render mode, fighter state, selected animation, and configured frame count.

## Adding Stage Art

The game now has an art asset pipeline under `public/assets/`. Vite serves everything in this folder from the site root, so `public/assets/vfx/hit-sparks.png` is referenced in code as `/assets/vfx/hit-sparks.png`.

The current procedural night-market arena remains the default fallback. This keeps the game playable while image assets are missing, loading, or invalid.

The included `Neon Street Alley` can be selected on the title screen. Its files live in `public/assets/stages/street-alley/`:

```text
bg-far.png
bg-mid.png
floor.png
fg-overlay.png
thumbnail.png
```

The original procedural night market is also selectable and remains the automatic fallback if a required custom-stage image fails to load.

To add a similar stage:

1. Add a new folder under `public/assets/stages/` with your image files.
2. Copy the street-alley entry in `src/game/stages.ts` and update its paths.
3. Set the new stage's `artEnabled` value to `true`.
4. Run `npm run dev`.

`bg-far.png` is the required rear image. Midground PNGs become flat planes at different depths and move at different follow rates for the 2.5D parallax effect. Foreground art renders with restrained opacity in front of the fighters. `floor.png` maps onto the ground plane. If the required background does not load, `StageManager` automatically keeps the procedural arena visible.

Each stage config supports:

```ts
{
  name,
  backgroundImage,
  parallaxLayers,
  foregroundOverlay,
  floorTexture,
  lighting,
  ambientParticles,
  musicPath,
  previewThumbnail
}
```

To add another stage, copy the street-alley entry in `src/game/stages.ts`, give it a unique ID, and point its paths at a new folder under `public/assets/stages/`.

## Adding VFX Art

Sprite-sheet effects are configured in `src/game/vfx.ts`. The procedural sparks remain in place as a fallback layer, and the reusable `VFXManager` caps active effects to keep rendering smooth.

The current VFX sheets live in `public/assets/vfx/`:

```text
hit-sparks.png
dust-puff.png
energy-slash.png
```

`hit-sparks.png` supplies hit and block frames. `dust-puff.png` animates when fighters dash or land. `energy-slash.png` animates once when a special attack begins and flips to match the attacker's facing direction. The supplied sheets include a baked pale checkerboard, so `VFXManager` filters that background in its shader.

For future sheets, update the path, column count, row count, frame order, size, and lifetime in `src/game/vfx.ts`. Transparent PNGs are preferred when available.

The remaining drop-in folders are ready for later UI, splash, and audio files:

```text
public/assets/ui/
public/assets/splash/
public/assets/audio/
```

## Arcade UI Atlas

The generated interface sheet lives at `public/assets/ui/arcade-ui-atlas.png`. The HUD uses CSS-first arcade health frames, a central timer, animated `ROUND 1`, `FIGHT`, `KO`, and `WIN` callouts, cleaned-up pause and rematch panels, and framed character cards.

`UiAtlasSprite` adds decorative atlas crops only after the PNG loads successfully. If the file is missing or fails to load, the CSS interface remains readable and playable. The submitted sheet includes a baked checkerboard, so its crops use restrained opacity and blending as enhancement layers rather than replacing live text.

## Local Testing Checklist

- Start a round with the button and with `Space`.
- Move both fighters to each arena edge and confirm they stop at the boundary.
- Test jump, dash, blocking, all four attacks, and `B` hitbox display.
- Press `Esc`, resume, restart the round, and return to Character Select.
- Finish a round by damage and use `RUN IT BACK`.
- Select each bundled GLB, adjust tuning sliders, and use `RESET TUNING`.
- Open `DEBUG MODEL VIEWER`, preview both submitted GLBs, and confirm each reaches `LOADED`.
- Temporarily add a bad model path while developing to confirm the fallback mesh appears.
- Start a round in `SPRITE MODE` before adding artwork and confirm both generated fallback fighters appear.
- Add one sprite sheet, update its frame count, and confirm its matching state animates while other states keep using fallbacks.

## Later Milestone

Mobile and touch controls are intentionally deferred until the desktop fighting loop is tuned.
