# Party Bot Sprite Sheets

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
dash.png
heavy-punch.png
special.png
knockdown.png
portrait.png
```

Each animation is a one-row PNG. Frame dimensions are inferred automatically from the image width and configured frame count in `src/game/spriteFighters.ts`.

Party Bot uses 6 light-punch frames, 7 kick frames, 6 KO frames, 5 dash frames, 7 heavy-punch frames, 8 special frames, and 6 knockdown frames. Optional move sheets still retain safe visual fallbacks if an asset is temporarily unavailable. If any required sprite sheet fails to load, sprite mode gracefully falls back to the generated placeholder fighter. See `docs/SPRITE_PRODUCTION_SPEC.md` for the upgraded `512x512` production format.
