import { mkdir, writeFile } from 'node:fs/promises'

const outputDir = new URL('../public/models/', import.meta.url)
const encoder = new TextEncoder()

const positions = new Float32Array([
  -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
  0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,
  -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
  0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5,
  -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
])
const normals = new Float32Array([
  0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
  0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
])
const indices = new Uint16Array([
  0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11,
  12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
])

const pad = (size) => (4 - (size % 4)) % 4
const bufferView = (typedArray) =>
  new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength)

function makeModel({ primary, accent, glove }) {
  const chunks = [bufferView(positions), bufferView(normals), bufferView(indices)]
  const binSize = chunks.reduce((size, chunk) => size + chunk.byteLength, 0)
  const bin = new Uint8Array(binSize)
  let cursor = 0
  const bufferViews = chunks.map((chunk, index) => {
    bin.set(chunk, cursor)
    const view = {
      buffer: 0,
      byteOffset: cursor,
      byteLength: chunk.byteLength,
      target: index === 2 ? 34963 : 34962,
    }
    cursor += chunk.byteLength
    return view
  })

  const part = (name, translation, scale, material = 0) => ({ name, mesh: material, translation, scale })
  const nodes = [
    { name: 'Static Fighter Skin', children: Array.from({ length: 12 }, (_, index) => index + 1) },
    part('Torso', [0, 1.45, 0], [0.86, 1.05, 0.48], 0),
    part('Head', [0, 2.55, 0], [0.62, 0.58, 0.58], 1),
    part('Left arm', [-0.72, 1.55, 0], [0.28, 0.94, 0.28], 0),
    part('Right arm', [0.72, 1.55, 0], [0.28, 0.94, 0.28], 0),
    part('Left glove', [-0.74, 0.94, 0.02], [0.4, 0.4, 0.42], 2),
    part('Right glove', [0.74, 0.94, 0.02], [0.4, 0.4, 0.42], 2),
    part('Left leg', [-0.3, 0.34, 0], [0.34, 0.98, 0.34], 1),
    part('Right leg', [0.3, 0.34, 0], [0.34, 0.98, 0.34], 1),
    part('Left shoe', [-0.31, -0.25, 0.14], [0.44, 0.26, 0.68], 2),
    part('Right shoe', [0.31, -0.25, 0.14], [0.44, 0.26, 0.68], 2),
    part('Belt', [0, 0.86, 0], [0.92, 0.18, 0.53], 2),
    part('Hair', [0, 2.98, -0.03], [0.68, 0.2, 0.62], 2),
  ]
  const materials = [primary, accent, glove].map((color, index) => ({
    name: ['Primary', 'Accent', 'Gloves'][index],
    pbrMetallicRoughness: { baseColorFactor: [...color, 1], metallicFactor: index === 2 ? 0.35 : 0.08, roughnessFactor: 0.55 },
  }))
  const gltf = {
    asset: { version: '2.0', generator: 'Ape Fighter placeholder generator' }, scene: 0, scenes: [{ nodes: [0] }], nodes,
    meshes: materials.map((_, material) => ({ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material }] })), materials,
    accessors: [
      { bufferView: 0, componentType: 5126, count: 24, type: 'VEC3', max: [0.5, 0.5, 0.5], min: [-0.5, -0.5, -0.5] },
      { bufferView: 1, componentType: 5126, count: 24, type: 'VEC3' }, { bufferView: 2, componentType: 5123, count: 36, type: 'SCALAR' },
    ], bufferViews, buffers: [{ byteLength: bin.byteLength }],
  }
  const json = encoder.encode(JSON.stringify(gltf))
  const jsonPadding = new Uint8Array(pad(json.byteLength)).fill(0x20)
  const binPadding = new Uint8Array(pad(bin.byteLength))
  const jsonLength = json.byteLength + jsonPadding.byteLength
  const binLength = bin.byteLength + binPadding.byteLength
  const totalLength = 12 + 8 + jsonLength + 8 + binLength
  const output = new Uint8Array(totalLength)
  const header = new DataView(output.buffer)
  header.setUint32(0, 0x46546c67, true); header.setUint32(4, 2, true); header.setUint32(8, totalLength, true)
  header.setUint32(12, jsonLength, true); header.setUint32(16, 0x4e4f534a, true); output.set(json, 20); output.set(jsonPadding, 20 + json.byteLength)
  const binHeader = 20 + jsonLength
  header.setUint32(binHeader, binLength, true); header.setUint32(binHeader + 4, 0x004e4942, true); output.set(bin, binHeader + 8); output.set(binPadding, binHeader + 8 + bin.byteLength)
  return output
}

await mkdir(outputDir, { recursive: true })
await writeFile(new URL('fighter-neon.glb', outputDir), makeModel({ primary: [0.04, 0.5, 0.78], accent: [0.04, 0.08, 0.18], glove: [0.99, 0.77, 0.1] }))
await writeFile(new URL('fighter-crimson.glb', outputDir), makeModel({ primary: [0.82, 0.08, 0.16], accent: [0.12, 0.015, 0.04], glove: [0.95, 0.32, 0.05] }))
console.log('Generated static placeholder GLB fighter skins.')
