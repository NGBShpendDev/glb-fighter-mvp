# Sprite Fighter Production Spec

Use this format for every fighter. Consistent sheets make animation changes predictable and prevent feet from jumping between frames.

## Canvas Rules

- Export every animation as a transparent PNG.
- Do not flatten a checkerboard preview or painted backdrop into the PNG. Run `npm run audit:sprites` after adding art.
- Use `512x512` pixels per frame for the high-quality source format.
- Place frames in one horizontal row with no gaps.
- Keep every frame canvas the same size, including attacks and KO poses.
- Place the fighter's ground contact point at the same pixel position in every grounded frame.
- Keep enough empty space around the character for extended punches, kicks, and falls.

An 8-frame animation should be exported as a `4096x512` PNG. The renderer divides the sheet width by its configured frame count, so frames must be evenly sized.

## Folder And Filenames

Create one folder per fighter:

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

`anchor.png` is a full-body alignment reference. `portrait.png` is the character-select image. Animation files use one horizontal sprite row.

## Animation Catalog

| Animation key | Filename | Frames | Level |
| --- | --- | ---: | --- |
| `idle` | `idle.png` | 8 | Required |
| `walk` | `walk.png` | 8 | Required |
| `dash` | `dash.png` | 5 | Recommended upgrade |
| `jump` | `jump.png` | 6 | Required |
| `block` | `block.png` | 4 | Required |
| `lightPunch` | `light-punch.png` | 6 | Required |
| `heavyPunch` | `heavy-punch.png` | 7 | Recommended upgrade |
| `kick` | `kick.png` | 7 | Required |
| `special` | `special.png` | 8 | Recommended upgrade |
| `hit` | `hit.png` | 4 | Required |
| `knockdown` | `knockdown.png` | 6 | Recommended upgrade |
| `ko` | `ko.png` | 6 | Required |
| `victory` | `victory.png` | 6 | Required |

Optional sheets are safe to add later. When an optional animation is absent from a fighter config, the game uses:

| Missing optional sheet | Visual fallback |
| --- | --- |
| `dash` | `walk` |
| `heavyPunch` | `lightPunch` |
| `special` | `kick` |
| `knockdown` | `ko` |

The fallback only changes the visible sheet. Gameplay movement, damage, cooldowns, and invisible hitboxes remain separate.

## Generating Sheets

1. Design a full-body `anchor.png` first. Mark the pixel where the fighter's feet touch the floor.
2. Generate or draw each animation pose on a transparent `512x512` canvas.
3. Align the feet to the same baseline for every grounded pose.
4. Arrange the frames left to right in playback order.
5. Export the row with its exact filename and place it in the fighter folder.
6. Add the frame count and playback FPS to the fighter config.
7. Open the in-game sprite debug panel with `V`, then preview each animation and enable `ORIGIN` and `BOUNDS`.

## Configuring A Fighter

Add the fighter ID to `SpriteFighterId` in `src/game/types.ts`, then add a fighter config in `src/game/spriteFighters.ts`.

The copyable full example is in:

```text
docs/examples/upgraded-sprite-fighter.config.ts
```

The renderer normally infers frame width from `image width / frameCount` and reads the image height directly. Set `frameWidth: 512` and `frameHeight: 512` when using this production format to catch accidental export-size changes during tuning.

## Offset Tuning

Start with:

```ts
scale: 3.05,
sourceFacing: 1,
horizontalOffset: 0,
verticalOffset: 0,
originX: 0.5,
originY: 0,
```

`originX: 0.5` centers the fighter horizontally. `originY: 0` pins the bottom of the sprite to the ground baseline. Prefer fixing alignment in the art export. Use animation-level `offsetX`, `offsetY`, or `scale` only for small corrections when an existing sheet cannot be regenerated immediately.

## Avoiding Choppy Movement

- Keep the feet on the same pixel baseline across grounded frames.
- Use identical `512x512` frame canvases for all animations.
- Do not crop each frame tightly around the character.
- Use the recommended frame counts as a target; fewer frames are supported, but transitions will feel more abrupt.
- Keep loop endpoints compatible: the final idle and walk frames should flow naturally back into frame zero.
- Test `idle -> walk -> idle`, `jump -> landing`, every attack, hit reaction, KO, and victory with `BOUNDS` and `ORIGIN` visible.
- Tune FPS after alignment. Faster playback cannot repair shifting anchors.

## Engine Reference

The production constants and safe optional fallback map live in `src/game/spriteFighters.ts` as `SPRITE_PRODUCTION_SPEC`, `REQUIRED_SPRITE_ANIMATIONS`, `OPTIONAL_SPRITE_ANIMATIONS`, and `SPRITE_OPTIONAL_FALLBACKS`.
