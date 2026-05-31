# Ape Fighter

A browser-based 2.5D local multiplayer fighting game MVP built with Vite, React, TypeScript, Three.js, React Three Fiber, Drei, and Zustand.

The included fighter GLBs are intentionally static meshes. The game controller owns movement, combat, hitboxes, and procedural animation, so uploaded non-rigged GLBs work as visual skins without skeletal animation, animation mixers, or rig assumptions.

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
- Uploaded `.glb` fighter skins with automatic height normalization and fallback meshes
- Local character-select screen with rotating GLB previews and per-fighter tuning
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
npm run build
```

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

## Project Structure

```text
api/
  upload.ts                      # Vercel Blob client-upload token route
src/
  components/
    Arena.tsx                 # Urban Three.js stage
    FighterController.tsx     # Reusable visual fighter shell
    GameScene.tsx             # Match loop, camera, controls, sparks
    GameUI.tsx                # HUD, title screen, KO flow
    CharacterSelect.tsx       # Local GLB selection and preview controls
    UploadCharacterPage.tsx   # Vercel Blob upload screen
  game/
    constants.ts              # Move tuning and controls
    hitboxes.ts               # Collision volumes and overlap checks
    types.ts                  # Combat types
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

Per-fighter visual tuning is stored locally in the Zustand game state:

```ts
{ scale: 1, rotationY: Math.PI / 2, verticalOffset: 0, horizontalOffset: 0 }
```

These values only adjust the visible skin. Movement, hitboxes, and hurtboxes remain locked to the 2.5D fighting plane.

## Later Milestone

Mobile and touch controls are intentionally deferred until the desktop fighting loop is tuned.
