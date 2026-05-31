import { rm } from 'node:fs/promises'

await rm('dist/models', { recursive: true, force: true })
console.log('Removed retired model assets from the production bundle.')
