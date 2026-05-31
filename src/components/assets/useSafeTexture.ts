import { useEffect, useState } from 'react'
import * as THREE from 'three'

type TextureStatus = 'idle' | 'loading' | 'loaded' | 'error'

type SafeTexture = {
  texture: THREE.Texture | null
  status: TextureStatus
}

const textureLoader = new THREE.TextureLoader()
const textureCache = new Map<string, THREE.Texture>()

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

    let active = true
    setResult({ texture: null, status: 'loading' })

    const texture = textureLoader.load(
      imagePath,
      () => {
        if (!active) return
        texture.colorSpace = THREE.SRGBColorSpace
        textureCache.set(imagePath, texture)
        setResult({ texture, status: 'loaded' })
        console.info(`[ART] loaded ${imagePath}`)
      },
      undefined,
      () => {
        if (!active) return
        setResult({ texture: null, status: 'error' })
        console.error(`[ART] failed ${imagePath}`)
      },
    )

    return () => {
      active = false
      if (!textureCache.has(imagePath)) texture.dispose()
    }
  }, [imagePath])

  return result
}
