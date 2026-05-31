# Ape Fighter

A browser-based 2.5D local multiplayer fighting game MVP built with Vite, React, TypeScript, Three.js, React Three Fiber, Drei, and Zustand.

The included fighter GLBs are intentionally static meshes. The game controller owns movement, combat, hitboxes, and procedural animation, so uploaded non-rigged GLBs work as visual skins without skeletal animation.

## Features

- 2.5D side-view arena with fighters locked to the X/Y plane
- Camera tracking, shadows, lighting, screen shake, sparks, and impact flashes
- Two keyboard-controlled fighters with walk, jump, dash, block, and four attacks
- Custom invisible hitbox and hurtbox collision logic with a `B` debug toggle
- Damage, knockback, hit stun, block stun, cooldowns, round timer, KO, and rematch
- Procedural idle, attack lunge, kick spin, recoil, KO fall, and victory motion
- Static placeholder `.glb` skins generated locally
- Local-only GLB upload preview with a future Vercel Blob integration point

## Local Development

Install dependencies and generate the included placeholder fighters:

```bash
npm install
npm run generate:models
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
src/
  components/
    Arena.tsx                 # Urban Three.js stage
    FighterController.tsx     # Reusable visual fighter shell
    GameScene.tsx             # Match loop, camera, controls, sparks
    GameUI.tsx                # HUD, title screen, KO flow
    ModelUploadPreview.tsx    # Local GLB preview stub
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
3. Use the default Vite settings:

```text
Build command: npm run build
Output directory: dist
```

The project is a static Vite app and does not need a server for the MVP.

## Planned Vercel Blob Upgrade

`ModelUploadPreview` currently creates a browser-local object URL. To persist skins:

1. Install `@vercel/blob`.
2. Add a server upload endpoint or a Vercel client-upload flow.
3. Store the returned Blob URL in the fighter profile.
4. Pass that URL into `FighterController` as the visual skin.

Keep validation in the upload path: accept `.glb`, apply a reasonable file-size limit, and treat the uploaded model as untrusted content.
