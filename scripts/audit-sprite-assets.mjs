import { build } from 'esbuild'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { decodePng, inspectTransparency } from './lib/png-rgba.mjs'

const requiredFiles = ['anchor.png', 'idle.png', 'walk.png', 'jump.png', 'block.png', 'light-punch.png', 'kick.png', 'hit.png', 'ko.png', 'victory.png']
const preferredFiles = ['portrait.png']
const optionalFiles = ['dash.png', 'heavy-punch.png', 'special.png', 'knockdown.png']
const directory = await mkdtemp(join(tmpdir(), 'ape-fighter-audit-'))
const output = join(directory, 'sprite-fighters.mjs')

const status = (present, label) => `${present ? 'OK ' : 'MISS'} ${label}`

try {
  await build({
    entryPoints: ['src/game/spriteFighters.ts'],
    outfile: output,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
  })
  const { SPRITE_FIGHTERS } = await import(`${pathToFileURL(output).href}?audit=${Date.now()}`)

  console.log('SPRITE ASSET REPORT')
  console.log('===================')
  for (const [fighterId, config] of Object.entries(SPRITE_FIGHTERS)) {
    const folder = `public/assets/fighters/${fighterId}`
    const files = await readdir(folder)
    const pngFiles = files.filter((file) => file.endsWith('.png')).sort()
    const references = [
      config.anchorPath,
      config.portraitPath,
      ...Object.values(config.animations).map((animation) => animation.file),
    ].filter(Boolean)
    const referencedNames = new Set(references.map((file) => basename(file)))
    const missingConfigReferences = references.filter((file) => !pngFiles.includes(basename(file)))
    const unusedFiles = pngFiles.filter((file) => !referencedNames.has(file))

    console.log(`\n${config.name} (${fighterId})`)
    console.log('-'.repeat(config.name.length + fighterId.length + 3))
    console.log('Required assets:')
    for (const file of requiredFiles) console.log(`  ${status(pngFiles.includes(file), file)}`)
    console.log('Preferred select portrait:')
    for (const file of preferredFiles) console.log(`  ${status(pngFiles.includes(file), file)}${pngFiles.includes(file) ? '' : ' (UI uses anchor.png fallback)'}`)
    console.log('Optional upgrades:')
    for (const file of optionalFiles) console.log(`  ${status(pngFiles.includes(file), file)}`)
    console.log('Missing configured references:')
    if (missingConfigReferences.length) {
      for (const file of missingConfigReferences) {
        const animation = Object.values(config.animations).find((candidate) => candidate.file === file)
        console.log(`  MISS ${file}${animation?.fallbackAnimation ? ` (safe fallback: ${animation.fallbackAnimation})` : ''}`)
      }
    } else {
      console.log('  none')
    }
    console.log('Unused PNG files:')
    console.log(unusedFiles.length ? `  ${unusedFiles.join(', ')}` : '  none')
    console.log('Sheet checks:')
    for (const [name, animation] of Object.entries(config.animations)) {
      const file = basename(animation.file)
      if (!pngFiles.includes(file)) continue
      const image = decodePng(await readFile(join(folder, file)))
      const transparency = inspectTransparency(image)
      const inferredFrameWidth = image.width / animation.frameCount
      const widthWarning = Number.isInteger(inferredFrameWidth) ? '' : ` | WARN non-integer frame width ${inferredFrameWidth.toFixed(2)}`
      const checkerWarning = transparency.likelyBakedCheckerboard ? ' | WARN likely baked checkerboard' : ''
      const alphaWarning = transparency.transparentRatio < 0.2 ? ` | WARN weak transparency ${(transparency.transparentRatio * 100).toFixed(1)}%` : ''
      console.log(`  ${name}: ${file} | ${image.width}x${image.height} | ${animation.frameCount} frames${widthWarning}${checkerWarning}${alphaWarning}`)
    }
    console.log('Recommended next sprites:')
    console.log(`  ${optionalFiles.filter((file) => !pngFiles.includes(file)).join(', ') || 'none'}`)
  }
} finally {
  await rm(directory, { recursive: true, force: true })
}
