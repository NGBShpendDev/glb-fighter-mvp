# Crimson Riot Sprite Sheets

The submitted Fighter 2 sprite sheets live in this folder:

```text
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

Each animation is a one-row PNG. Frame dimensions are inferred automatically from the image width and configured frame count in `src/game/spriteFighters.ts`.

`heavy-punch.png` and `special.png` are still optional future additions. Until those exist, heavy punch reuses `light-punch.png` and special reuses `kick.png`. If any sprite sheet fails to load, sprite mode gracefully falls back to the closest configured animation or the generated placeholder fighter.
