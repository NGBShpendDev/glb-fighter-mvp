import { Float, Text } from '@react-three/drei'
import type { ReactNode } from 'react'

const Building = ({
  x,
  y,
  width,
  height,
  color,
  children,
}: {
  x: number
  y: number
  width: number
  height: number
  color: string
  children?: ReactNode
}) => (
  <group position={[x, y, -3.6]}>
    <mesh receiveShadow>
      <boxGeometry args={[width, height, 1.35]} />
      <meshStandardMaterial color={color} roughness={0.92} />
    </mesh>
    {Array.from({ length: Math.floor(width) }).map((_, column) =>
      Array.from({ length: Math.max(1, Math.floor(height / 1.1)) }).map((__, row) => (
        <mesh
          key={`${column}-${row}`}
          position={[-width / 2 + 0.6 + column, -height / 2 + 0.72 + row * 1.1, 0.69]}
        >
          <planeGeometry args={[0.34, 0.46]} />
          <meshBasicMaterial color={(column + row) % 3 === 0 ? '#ffd24a' : '#16233b'} />
        </mesh>
      )),
    )}
    {children}
  </group>
)

const Lamp = ({ x }: { x: number }) => (
  <group position={[x, 0, -0.95]}>
    <mesh position={[0, 1.9, 0]} castShadow>
      <cylinderGeometry args={[0.045, 0.065, 3.8, 8]} />
      <meshStandardMaterial color="#212535" metalness={0.8} roughness={0.35} />
    </mesh>
    <mesh position={[0.3, 3.8, 0]} castShadow>
      <boxGeometry args={[0.75, 0.12, 0.16]} />
      <meshStandardMaterial color="#23293b" metalness={0.75} />
    </mesh>
    <mesh position={[0.61, 3.7, 0]}>
      <sphereGeometry args={[0.14, 10, 10]} />
      <meshBasicMaterial color="#72e7ff" />
    </mesh>
    <pointLight position={[0.6, 3.6, 0.5]} color="#56d6ff" intensity={4.2} distance={5} />
  </group>
)

const MarketStall = ({ x, color, sign }: { x: number; color: string; sign: string }) => (
  <group position={[x, 0.1, -2.15]}>
    <mesh position={[0, 0.86, 0]} receiveShadow castShadow>
      <boxGeometry args={[2.45, 1.7, 0.9]} />
      <meshStandardMaterial color="#171b2b" roughness={0.82} />
    </mesh>
    <mesh position={[0, 1.82, 0.36]} rotation={[0.1, 0, 0]} castShadow>
      <boxGeometry args={[2.7, 0.16, 1.15]} />
      <meshStandardMaterial color={color} roughness={0.68} />
    </mesh>
    <mesh position={[0, 1.22, 0.48]}>
      <planeGeometry args={[1.82, 0.46]} />
      <meshBasicMaterial color={color} />
    </mesh>
    <Text position={[0, 1.22, 0.5]} fontSize={0.22} color="#fff4cf">
      {sign}
    </Text>
  </group>
)

const Crowd = () => (
  <group position={[0, 0, -1.72]}>
    {Array.from({ length: 19 }).map((_, index) => {
      const x = -8.3 + index * 0.92
      const height = 0.74 + (index % 4) * 0.09
      return (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, height * 0.58, 0]}>
            <capsuleGeometry args={[0.17, height, 4, 7]} />
            <meshStandardMaterial color={index % 3 === 0 ? '#202942' : '#171c31'} roughness={0.9} />
          </mesh>
          <mesh position={[0, height + 0.28, 0]}>
            <sphereGeometry args={[0.19, 8, 8]} />
            <meshStandardMaterial color="#13182a" />
          </mesh>
        </group>
      )
    })}
  </group>
)

export const Arena = () => (
  <>
    <color attach="background" args={['#080a15']} />
    <fog attach="fog" args={['#080a15', 12, 25]} />
    <ambientLight intensity={0.85} color="#6570a2" />
    <directionalLight
      castShadow
      position={[4, 10, 8]}
      intensity={2.4}
      color="#ffe6c6"
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
    />
    <pointLight position={[-6, 4, 3]} color="#ff2d68" intensity={7} distance={11} />
    <pointLight position={[6, 3, 3]} color="#13bfff" intensity={6} distance={11} />
    <pointLight position={[0, 2.8, -1]} color="#fbd850" intensity={3.4} distance={8} />

    <Building x={-7.8} y={3.2} width={5.7} height={6.4} color="#13182b" />
    <Building x={-1.7} y={4.1} width={5.6} height={8.1} color="#181a2b">
      <mesh position={[0, 0.7, 0.72]}>
        <planeGeometry args={[3.6, 1]} />
        <meshBasicMaterial color="#d21f55" />
      </mesh>
      <Text
        position={[0, 0.7, 0.75]}
        fontSize={0.54}
        color="#fff2ba"
        anchorX="center"
        anchorY="middle"
      >
        FIGHT NIGHT
      </Text>
    </Building>
    <Building x={4.8} y={3.5} width={6.4} height={7} color="#111a2c" />
    <Building x={10.5} y={2.8} width={4.5} height={5.6} color="#1b1727" />

    <mesh receiveShadow position={[0, -0.1, 0]}>
      <boxGeometry args={[19, 0.28, 7]} />
      <meshStandardMaterial color="#242637" roughness={0.82} metalness={0.1} />
    </mesh>
    <mesh receiveShadow position={[0, 0.06, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[19, 6.4]} />
      <meshStandardMaterial color="#2c2d38" roughness={0.74} metalness={0.18} />
    </mesh>
    <mesh position={[-3.5, 0.071, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2.8, 0.62]} />
      <meshBasicMaterial color="#ff2d68" transparent opacity={0.13} />
    </mesh>
    <mesh position={[3.8, 0.072, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3.4, 0.72]} />
      <meshBasicMaterial color="#13bfff" transparent opacity={0.13} />
    </mesh>
    {[-7.5, -2.5, 2.5, 7.5].map((x) => (
      <mesh key={x} position={[x, 0.075, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 0.12]} />
        <meshBasicMaterial color="#c6b248" />
      </mesh>
    ))}
    <mesh position={[0, 1.2, -2.1]}>
      <boxGeometry args={[18, 0.85, 0.35]} />
      <meshStandardMaterial color="#353647" roughness={0.92} />
    </mesh>
    <Text position={[-5.2, 1.25, -1.9]} fontSize={0.58} color="#ff4f81" rotation={[0, 0, -0.08]}>
      NO MERCY
    </Text>
    <Text position={[2.2, 1.23, -1.89]} fontSize={0.5} color="#52e5ff" rotation={[0, 0, 0.04]}>
      APE DISTRICT
    </Text>
    <Lamp x={-6.4} />
    <Lamp x={6.4} />
    <Crowd />
    <MarketStall x={-5.1} color="#d52c5c" sign="RAMEN // 24H" />
    <MarketStall x={5} color="#168eb5" sign="ARCADE // OPEN" />
    <Float speed={2} rotationIntensity={0.08} floatIntensity={0.25}>
      <Text position={[0, 5.7, -2.5]} fontSize={0.82} color="#fbd850">
        NIGHT MARKET // 98
      </Text>
    </Float>
  </>
)
