# Fighter 1 Sprite Sheets: Cheetah Chief

The submitted Cheetah Chief sprite sheets live in this folder. `anchor.png` is the static alignment reference and `portrait.png` is used on the character-select screen.

```text
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

The renderer infers each animation's frame width from the full sheet width divided by its configured frame count. It reads the frame height directly from the sheet. This lets different animations use different canvas sizes.

Frame counts and FPS values are configured in `src/game/spriteFighters.ts`. The current submitted set is:

| Animation | Frames |
| --- | ---: |
| idle | 4 |
| walk | 6 |
| dash | 5 |
| jump | 4 |
| block | 3 |
| lightPunch | 6 |
| heavyPunch | 7 |
| kick | 7 |
| special | 8 |
| hit | 3 |
| knockdown | 6 |
| ko | 6 |
| victory | 4 |

The upgraded sheets retain visual fallbacks to walk, light punch, kick, and KO if a future upload is missing or fails to load. See `docs/SPRITE_PRODUCTION_SPEC.md` for the upgraded `512x512` production format.
