import { readFile } from 'node:fs/promises'

const models = [
  { publicUrl: '/models/fighter-1.glb', file: 'public/models/fighter-1.glb' },
  { publicUrl: '/models/fighter-2.glb', file: 'public/models/fighter-2.glb' },
]

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

for (const model of models) {
  const bytes = await readFile(model.file)
  const magic = bytes.subarray(0, 4).toString()
  const version = bytes.readUInt32LE(4)
  const declaredLength = bytes.readUInt32LE(8)
  const jsonLength = bytes.readUInt32LE(12)
  const jsonType = bytes.subarray(16, 20).toString()
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString().trim())

  assert(magic === 'glTF', `${model.file} is not a GLB binary.`)
  assert(version === 2, `${model.file} must use GLB version 2.`)
  assert(declaredLength === bytes.length, `${model.file} has a mismatched declared length.`)
  assert(jsonType === 'JSON', `${model.file} does not start with a JSON chunk.`)
  assert((gltf.scenes?.length ?? 0) > 0, `${model.file} does not contain a scene.`)
  assert((gltf.nodes?.length ?? 0) > 0, `${model.file} does not contain nodes.`)
  assert((gltf.meshes?.length ?? 0) > 0, `${model.file} does not contain meshes.`)

  console.log(
    `PASS ${model.publicUrl} -> ${model.file} (${(bytes.length / (1024 * 1024)).toFixed(2)} MB, ${gltf.nodes.length} nodes, ${gltf.meshes.length} meshes)`,
  )
}
