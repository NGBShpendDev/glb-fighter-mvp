import { deflateSync, inflateSync } from 'node:zlib'

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  return value >>> 0
})

const crc32 = (buffer) => {
  let value = 0xffffffff
  for (const byte of buffer) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8)
  return (value ^ 0xffffffff) >>> 0
}

const chunk = (name, data = Buffer.alloc(0)) => {
  const type = Buffer.from(name)
  const output = Buffer.alloc(12 + data.length)
  output.writeUInt32BE(data.length, 0)
  type.copy(output, 4)
  data.copy(output, 8)
  output.writeUInt32BE(crc32(Buffer.concat([type, data])), 8 + data.length)
  return output
}

const paeth = (left, above, upperLeft) => {
  const estimate = left + above - upperLeft
  const leftDistance = Math.abs(estimate - left)
  const aboveDistance = Math.abs(estimate - above)
  const upperLeftDistance = Math.abs(estimate - upperLeft)
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left
  return aboveDistance <= upperLeftDistance ? above : upperLeft
}

export const decodePng = (buffer) => {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('Not a PNG file')

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let interlace = 0
  const imageChunks = []

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const name = buffer.toString('ascii', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    offset += 12 + length
    if (name === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
      interlace = data[12]
    }
    if (name === 'IDAT') imageChunks.push(data)
    if (name === 'IEND') break
  }

  if (bitDepth !== 8 || interlace !== 0 || ![2, 6].includes(colorType)) {
    throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlace}`)
  }

  const channels = colorType === 6 ? 4 : 3
  const stride = width * channels
  const inflated = inflateSync(Buffer.concat(imageChunks))
  const rows = Buffer.alloc(height * stride)

  for (let y = 0; y < height; y += 1) {
    const sourceOffset = y * (stride + 1)
    const destinationOffset = y * stride
    const filter = inflated[sourceOffset]
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset + x + 1]
      const left = x >= channels ? rows[destinationOffset + x - channels] : 0
      const above = y > 0 ? rows[destinationOffset + x - stride] : 0
      const upperLeft = y > 0 && x >= channels ? rows[destinationOffset + x - stride - channels] : 0
      const value =
        filter === 0 ? raw
          : filter === 1 ? raw + left
            : filter === 2 ? raw + above
              : filter === 3 ? raw + Math.floor((left + above) / 2)
                : filter === 4 ? raw + paeth(left, above, upperLeft)
                  : Number.NaN
      if (Number.isNaN(value)) throw new Error(`Unsupported PNG filter: ${filter}`)
      rows[destinationOffset + x] = value & 0xff
    }
  }

  const pixels = Buffer.alloc(width * height * 4)
  for (let index = 0; index < width * height; index += 1) {
    pixels[index * 4] = rows[index * channels]
    pixels[index * 4 + 1] = rows[index * channels + 1]
    pixels[index * 4 + 2] = rows[index * channels + 2]
    pixels[index * 4 + 3] = channels === 4 ? rows[index * channels + 3] : 255
  }

  return { width, height, pixels, sourceColorType: colorType }
}

export const encodePng = ({ width, height, pixels }) => {
  const stride = width * 4
  const raw = Buffer.alloc(height * (stride + 1))
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6
  return Buffer.concat([PNG_SIGNATURE, chunk('IHDR', header), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND')])
}

export const inspectTransparency = ({ width, height, pixels }) => {
  let transparentPixels = 0
  let opaqueBorderPixels = 0
  let neutralBrightBorderPixels = 0
  const visit = (x, y) => {
    const index = (y * width + x) * 4
    const red = pixels[index]
    const green = pixels[index + 1]
    const blue = pixels[index + 2]
    const alpha = pixels[index + 3]
    if (alpha >= 250) {
      opaqueBorderPixels += 1
      const brightest = Math.max(red, green, blue)
      const darkest = Math.min(red, green, blue)
      if (brightest >= 185 && brightest - darkest <= 28) neutralBrightBorderPixels += 1
    }
  }

  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 250) transparentPixels += 1
  }

  for (let x = 0; x < width; x += 1) {
    visit(x, 0)
    if (height > 1) visit(x, height - 1)
  }
  for (let y = 1; y < height - 1; y += 1) {
    visit(0, y)
    if (width > 1) visit(width - 1, y)
  }

  const totalPixels = width * height
  const borderNeutralRatio = opaqueBorderPixels ? neutralBrightBorderPixels / opaqueBorderPixels : 0
  return {
    hasTransparency: transparentPixels > 0,
    transparentRatio: transparentPixels / totalPixels,
    borderNeutralRatio,
    likelyBakedCheckerboard: borderNeutralRatio > 0.55 && transparentPixels / totalPixels < 0.08,
  }
}

export const removeBorderConnectedNeutralBackground = ({ width, height, pixels }) => {
  const queued = new Uint8Array(width * height)
  const queue = []
  let removedPixels = 0
  const isBackground = (pixelIndex) => {
    const offset = pixelIndex * 4
    const red = pixels[offset]
    const green = pixels[offset + 1]
    const blue = pixels[offset + 2]
    const alpha = pixels[offset + 3]
    if (alpha === 0) return true
    const brightest = Math.max(red, green, blue)
    const darkest = Math.min(red, green, blue)
    return alpha >= 245 && brightest >= 180 && brightest - darkest <= 34
  }
  const add = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const index = y * width + x
    if (queued[index] || !isBackground(index)) return
    queued[index] = 1
    queue.push(index)
  }

  for (let x = 0; x < width; x += 1) {
    add(x, 0)
    add(x, height - 1)
  }
  for (let y = 1; y < height - 1; y += 1) {
    add(0, y)
    add(width - 1, y)
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor]
    const offset = index * 4
    if (pixels[offset + 3] !== 0) {
      pixels[offset + 3] = 0
      removedPixels += 1
    }
    const x = index % width
    const y = Math.floor(index / width)
    add(x - 1, y)
    add(x + 1, y)
    add(x, y - 1)
    add(x, y + 1)
  }

  return removedPixels
}
