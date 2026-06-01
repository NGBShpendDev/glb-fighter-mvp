import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { decodePng, encodePng, removeBorderConnectedNeutralBackground } from './lib/png-rgba.mjs'

for (const fighterId of ['fighter-1', 'fighter-2']) {
  const folder = `public/assets/fighters/${fighterId}`
  const files = (await readdir(folder)).filter((file) => file.endsWith('.png')).sort()
  for (const file of files) {
    const path = join(folder, file)
    const image = decodePng(await readFile(path))
    const removedPixels = removeBorderConnectedNeutralBackground(image)
    if (!removedPixels) {
      console.log(`SKIP ${path}`)
      continue
    }
    await writeFile(path, encodePng(image))
    console.log(`CLEAN ${path} (${removedPixels} pixels made transparent)`)
  }
}
