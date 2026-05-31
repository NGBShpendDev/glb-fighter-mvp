import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import * as THREE from 'three'
import { CONTROLS } from '../game/constants'
import { useGameStore } from '../store/gameStore'
import { Arena } from './Arena'
import { FighterController } from './FighterController'
const GAME_KEYS = new Set([...Object.values(CONTROLS.p1), ...Object.values(CONTROLS.p2), 'KeyB', 'Space'])
const ControlsBridge = () => { const setKey = useGameStore((state) => state.setKey); const start = useGameStore((state) => state.startMatch); const toggle = useGameStore((state) => state.toggleHitboxes); useEffect(() => { const handle = (event: KeyboardEvent, down: boolean) => { if (!GAME_KEYS.has(event.code)) return; event.preventDefault(); if (down && !event.repeat && event.code === 'KeyB') toggle(); if (down && !event.repeat && event.code === 'Space' && useGameStore.getState().phase === 'title') start(); setKey(event.code, down) }; const press = (e: KeyboardEvent) => handle(e, true); const release = (e: KeyboardEvent) => handle(e, false); window.addEventListener('keydown', press); window.addEventListener('keyup', release); return () => { window.removeEventListener('keydown', press); window.removeEventListener('keyup', release) } }, [setKey, start, toggle]); return null }
const MatchLoop = () => { const update = useGameStore((state) => state.update); useFrame((_, delta) => update(delta), -10); return null }
const CameraRig = () => { useFrame(({ camera, clock }) => { const { fighters, shake } = useGameStore.getState(); const midpoint = (fighters.p1.x + fighters.p2.x) / 2; const target = new THREE.Vector3(midpoint + Math.sin(clock.elapsedTime * 92) * shake, 2.55 + Math.cos(clock.elapsedTime * 76) * shake * 0.6, 11.4 + Math.abs(fighters.p1.x - fighters.p2.x) * 0.12); camera.position.lerp(target, 0.075); camera.lookAt(midpoint, 1.65, 0) }); return null }
const Sparks = () => { const sparks = useGameStore((state) => state.sparks); return <>{sparks.map((spark) => <mesh key={spark.id} position={[spark.x, spark.y, 0.8]} scale={1 - spark.age / spark.life}><sphereGeometry args={[0.35, 8, 8]} /><meshBasicMaterial color={spark.color} /></mesh>)}</> }
export const GameScene = () => <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 2.55, 11.4], fov: 44 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}><ControlsBridge /><MatchLoop /><CameraRig /><Suspense fallback={null}><Arena /><FighterController id="p1" /><FighterController id="p2" /><Sparks /></Suspense></Canvas>
