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

`dash.png`, `heavy-punch.png`, `special.png`, and `knockdown.png` are optional future additions. Until those exist, the renderer safely uses walk, light punch, kick, and KO visuals. If any required sprite sheet fails to load, sprite mode gracefully falls back to the generated placeholder fighter. See `docs/SPRITE_PRODUCTION_SPEC.md` for the upgraded `512x512` production format.
