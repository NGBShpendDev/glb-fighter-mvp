# Fighter 1 Sprite Sheets: Safari Striker

The submitted Safari Striker sprite sheets live in this folder. `anchor.png` is the static reference image used when adjusting visual alignment.

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

The renderer infers each animation's frame width from the full sheet width divided by its configured frame count. It reads the frame height directly from the sheet. This lets different animations use different canvas sizes.

Frame counts and FPS values are configured in `src/game/spriteFighters.ts`. The current submitted set is:

| Animation | Frames |
| --- | ---: |
| idle | 4 |
| walk | 6 |
| jump | 4 |
| block | 3 |
| lightPunch | 5 |
| kick | 5 |
| hit | 3 |
| ko | 5 |
| victory | 4 |

`kick.png` still needs to be added. Until it exists, kick and special animations intentionally display the generated fallback fighter.
