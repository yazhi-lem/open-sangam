/**
 * TinaiScene3D — data-driven WebGL diorama for a Tiṇai zone.
 *
 * Entirely parameterized by getVisualTheme() (data/tinaiTheme.js) and the
 * zone's flora/fauna lists (data/tinaiWorld.js) — a new zone needs only a new
 * theme + world-data entry, never a new scene component. Detail level scales
 * instance/segment counts so the same component runs on a low-end phone or a
 * desktop GPU.
 */
import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { getVisualTheme } from '../../data/tinaiTheme'
import { TINAI_WORLD } from '../../data/tinaiWorld'
import { getEmojiTexture } from './emojiSprite'
import { terrainHeight, scatterPoints, seededRandom, hashString } from './worldGen'

const DETAIL_PRESETS = {
  high: { segments: 48, flora: 10, fauna: 6, dpr: [1, 1.75], antialias: true },
  low: { segments: 20, flora: 5, fauna: 3, dpr: [1, 1], antialias: false },
}

function Terrain({ visual, segments }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(6, 6, segments, segments)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, terrainHeight(visual.terrain, x, z))
    }
    geo.computeVertexNormals()
    return geo
  }, [visual.terrain, segments])

  return (
    <mesh geometry={geometry} receiveShadow={false}>
      <meshStandardMaterial color={visual.ground} roughness={0.95} metalness={0} flatShading />
    </mesh>
  )
}

function WaterPlane({ visual }) {
  const ref = useRef(null)
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(6, 3, 24, 12)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const pos = ref.current.geometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, Math.sin(x * 1.5 + t) * 0.03 + Math.cos(z * 1.2 + t * 0.8) * 0.03)
    }
    pos.needsUpdate = true
  })

  return (
    <mesh ref={ref} geometry={geometry} position={[0, -0.02, 1.6]}>
      <meshStandardMaterial color={visual.groundAccent} transparent opacity={0.75} roughness={0.2} metalness={0.3} />
    </mesh>
  )
}

function GlyphSprite({ glyph, position, scale }) {
  const texture = useMemo(() => getEmojiTexture(glyph), [glyph])
  return (
    <sprite position={position} scale={[scale, scale, scale]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  )
}

function GlyphField({ tinaiId, items, seedOffset, count, heightOffset, terrainType }) {
  const points = useMemo(
    () => scatterPoints(hashString(tinaiId) + seedOffset, Math.min(count, items.length || count)),
    [tinaiId, seedOffset, count, items.length]
  )

  if (!items.length) return null

  return points.map((p, i) => {
    const item = items[i % items.length]
    const y = terrainHeight(terrainType, p.x, p.z) + heightOffset
    return (
      <GlyphSprite
        key={`${item.ta}-${i}`}
        glyph={item.emoji || '❈'}
        position={[p.x, y, p.z]}
        scale={0.42 * p.scale}
      />
    )
  })
}

function StarField() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const count = 200
    const positions = new Float32Array(count * 3)
    const rand = seededRandom(hashString('starfield'))
    for (let i = 0; i < count; i++) {
      const radius = 8 + rand() * 4
      const theta = rand() * Math.PI * 2
      const phi = rand() * (Math.PI / 2.2)
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = 1.5 + radius * Math.cos(phi) * 0.6
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#ffffff" size={0.045} sizeAttenuation transparent opacity={0.8} />
    </points>
  )
}

function Sun({ color }) {
  const ref = useRef(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 1.2) * 0.06
    ref.current.scale.setScalar(pulse)
  })
  return (
    <mesh ref={ref} position={[1.6, 2.6, -1.8]}>
      <sphereGeometry args={[0.35, 16, 16]} />
      <meshBasicMaterial color={color} />
      <pointLight color={color} intensity={2.5} distance={8} />
    </mesh>
  )
}

function SceneContents({ tinaiId, detail }) {
  const visual = getVisualTheme(tinaiId)
  const world = TINAI_WORLD[tinaiId]
  const preset = DETAIL_PRESETS[detail] || DETAIL_PRESETS.high

  return (
    <>
      <color attach="background" args={[visual.sky.top]} />
      <fog attach="fog" args={[visual.fog, 4, 11]} />

      <ambientLight color={visual.ambientLight} intensity={0.65} />
      <directionalLight color={visual.keyLight} intensity={1.1} position={[3, 4, 2]} />

      <Terrain visual={visual} segments={preset.segments} />
      {visual.water && <WaterPlane visual={visual} />}
      {visual.stars && <StarField />}
      {visual.sun && <Sun color={visual.sun} />}

      {world && (
        <>
          <GlyphField
            tinaiId={tinaiId}
            items={world.flora}
            seedOffset={1}
            count={preset.flora}
            heightOffset={0.3}
            terrainType={visual.terrain}
          />
          <GlyphField
            tinaiId={tinaiId}
            items={world.fauna}
            seedOffset={2}
            count={preset.fauna}
            heightOffset={0.5}
            terrainType={visual.terrain}
          />
        </>
      )}

      <OrbitControls
        target={[0, 0.4, 0]}
        minDistance={3.2}
        maxDistance={8}
        maxPolarAngle={Math.PI / 2.05}
        enableDamping
        dampingFactor={0.08}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  )
}

export default function TinaiScene3D({ tinaiId, detail = 'high' }) {
  const preset = DETAIL_PRESETS[detail] || DETAIL_PRESETS.high

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: '320px' }} role="img" aria-label={`${tinaiId} 3D landscape`}>
      <Canvas
        dpr={preset.dpr}
        gl={{ antialias: preset.antialias, powerPreference: detail === 'low' ? 'low-power' : 'default' }}
        camera={{ position: [0, 2.4, 5.2], fov: 45 }}
      >
        <Suspense fallback={null}>
          <SceneContents tinaiId={tinaiId} detail={detail} />
        </Suspense>
      </Canvas>
    </div>
  )
}
