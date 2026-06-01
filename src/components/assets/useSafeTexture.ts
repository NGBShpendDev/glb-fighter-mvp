import { useEffect, useState } from 'react'
import * as THREE from 'three'

type TextureStatus = 'idle' | 'loading' | 'loaded' | 'error'

type SafeTexture = {
  texture: THREE.Texture | null
  status: TextureStatus
}

const textureLoader = new THREE.TextureLoader()
const textureCache = new Map<string, THREE.Texture>()
const textureRequests = new Map<string, Promise<THREE.Texture>>()
const textureErrors = new Set<string>()

const loadTexture = (imagePath: string) => {
  const cachedTexture = textureCache.get(imagePath)
  if (cachedTexture) return Promise.resolve(cachedTexture)

  const pendingRequest = textureRequests.get(imagePath)
  if (pendingRequest) return pendingRequest

  const request = new Promise<THREE.Texture>((resolve, reject) => {
    const texture = textureLoader.load(
      imagePath,
      () => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.generateMipmaps = false
        texture.needsUpdate = true
        textureCache.set(imagePath, texture)
        textureErrors.delete(imagePath)
        console.info(`[ART] loaded ${imagePath}`)
        resolve(texture)
      },
      undefined,
      () => {
        texture.dispose()
        textureErrors.add(imagePath)
        console.error(`[ART] failed ${imagePath}`)
        reject(new Error(`Failed to load ${imagePath}`))
      },
    )
  }).finally(() => {
    textureRequests.delete(imagePath)
  })

  textureRequests.set(imagePath, request)
  return request
}

export const preloadSafeTextures = (imagePaths: string[]) => {
  for (const imagePath of new Set(imagePaths)) {
    void loadTexture(imagePath).catch(() => undefined)
  }
}

export const useSafeTexture = (imagePath?: string): SafeTexture => {
  const [result, setResult] = useState<SafeTexture>({ texture: null, status: 'idle' })

  useEffect(() => {
    if (!imagePath) {
      setResult({ texture: null, status: 'idle' })
      return
    }

    const cachedTexture = textureCache.get(imagePath)
    if (cachedTexture) {
      setResult({ texture: cachedTexture, status: 'loaded' })
      return
    }

    if (textureErrors.has(imagePath)) {
      setResult({ texture: null, status: 'error' })
      return
    }

    let active = true
    setResult({ texture: null, status: 'loading' })

    void loadTexture(imagePath)
      .then((texture) => {
        if (active) {
        setResult({ texture, status: 'loaded' })
        }
      })
      .catch(() => {
        if (active) {
        setResult({ texture: null, status: 'error' })
        }
      })

    return () => {
      active = false
    }
  }, [imagePath])

  return result
}
