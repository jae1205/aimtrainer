import { memo, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Block, Plaque, RangeSurfaces, RepeatedBlocks, Strip } from './RangeDetails'

function RangeFront({ opening, backZ, floorY, ceilingY, wallX }) {
  const half = opening.width / 2
  const bottom = opening.centerY - opening.height / 2
  const top = opening.centerY + opening.height / 2
  const outerHalf = half + 0.24
  const outerBottom = bottom - 0.22
  const outerTop = top + 0.22
  // Keep structural reveals behind the solid part of the trim, not on the
  // same x/y planes as its inner faces (which caused camera-motion z-fighting).
  const wallHalf = half + 0.14
  const wallBottom = bottom - 0.12
  const wallTop = top + 0.12
  // One continuous frame: no intersecting coplanar corner faces.
  const surround = useMemo(() => {
    const outer = new THREE.Shape()
    outer.moveTo(-outerHalf + 0.1, outerBottom)
    outer.lineTo(outerHalf - 0.1, outerBottom)
    outer.lineTo(outerHalf, outerBottom + 0.1)
    outer.lineTo(outerHalf, outerTop - 0.1)
    outer.lineTo(outerHalf - 0.1, outerTop)
    outer.lineTo(-outerHalf + 0.1, outerTop)
    outer.lineTo(-outerHalf, outerTop - 0.1)
    outer.lineTo(-outerHalf, outerBottom + 0.1)
    outer.closePath()
    const hole = new THREE.Path()
    hole.moveTo(-half, bottom)
    hole.lineTo(-half, top)
    hole.lineTo(half, top)
    hole.lineTo(half, bottom)
    hole.closePath()
    outer.holes.push(hole)
    return new THREE.ExtrudeGeometry(outer, { depth: 0.48, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, steps: 1 })
  }, [outerHalf, outerBottom, outerTop, half, bottom, top])
  useEffect(() => () => surround.dispose(), [surround])
  const grooves = [-1, 1].flatMap((side) => Array.from({ length: 6 }, (_, i) => ({
    position: [side * 4.45, -0.85 + i * 0.4, backZ + 0.18],
    size: [2.12, 0.29, 0.16], rotation: [0.18, 0, 0],
  })))

  return (
    <RangeSurfaces><group name="range-front">
      <mesh name="target-backdrop" position={[0, opening.centerY, opening.targetZ - 0.8]} renderOrder={-1}>
        <planeGeometry args={[opening.width + 2, opening.height + 2]} />
        <meshBasicMaterial color="#29362f" toneMapped={false} fog={false} />
      </mesh>
      {/* Four non-overlapping structural wall sections surround the target aperture. */}
      <Block position={[0, (ceilingY + wallTop) / 2, backZ - 0.2]}
        size={[wallX * 2, ceilingY - wallTop, 0.4]} color="#77776d" />
      <Block position={[0, (floorY + wallBottom) / 2, backZ - 0.2]}
        size={[wallX * 2, wallBottom - floorY, 0.4]} color="#737667" />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Block position={[side * (wallX + wallHalf) / 2, opening.centerY, backZ - 0.2]}
            size={[wallX - wallHalf, wallTop - wallBottom, 0.4]} color="#77776d" />
          {/* Broad acoustic recesses, kept clear of the central shooting field. */}
          <Block position={[side * 4.45, 1.2, backZ + 0.04]}
            size={[2.25, 4.75, 0.08]} color="#29372f" />
          <Block position={[side * 3.13, 1.15, backZ + 0.22]}
            size={[0.23, 5.25, 0.36]} color="#686d65" metalness={0.25} />
          <Block position={[side * 5.72, 1.15, backZ + 0.18]}
            size={[0.16, 5.25, 0.36]} color="#7b836c" metalness={0.3} />
          <Block position={[side * 3.31, 1.25, backZ + 0.135]}
            size={[0.04, 3.55, 0.04]} color="#343a35" />
          <Block position={[side * 4.45, -1.45, backZ + 0.13]}
            size={[2.22, 0.39, 0.24]} color="#667259" />
        </group>
      ))}
      <RepeatedBlocks items={grooves} color="#3e443d" metalness={0} />
      <Plaque position={[-4.46, 2.37, backZ + 0.095]} width={1.72} height={1.58}
        title="01" subtitle="PRECISION BAY" large />
      <Plaque position={[4.46, 2.43, backZ + 0.095]} width={1.72} height={0.75}
        title="AIMFORGE" subtitle="RANGE / READY" />
      <Strip position={[4.95, 1.78, backZ + 0.12]} size={[0.12, 0.05, 0.03]} color="#b4cb92" />

      {/* A dark, recessed lintel makes the main opening read as a shooting bay. */}
      <Block position={[0, 3.42, backZ + 0.2]} size={[5.95, 0.66, 0.4]} color="#2b3730" />
      <Plaque position={[-1.52, 3.43, backZ + 0.415]} width={2.4} height={0.36}
        title="THE RANGE" subtitle="AIMFORGE SHOOTING CLUB" />
      <Strip position={[1.93, 3.43, backZ + 0.42]} size={[1.35, 0.03, 0.03]} color="#c9af7d" />
      <mesh geometry={surround} position={[0, 0, backZ - 0.12]} castShadow receiveShadow>
        <meshStandardMaterial color="#75796d" roughness={0.62} metalness={0.2} />
      </mesh>
      <Strip position={[0, top + 0.055, backZ + 0.38]}
        size={[opening.width - 0.16, 0.028, 0.025]} color="#e9dbc0" />
      {/* Split knee-height armor with a separate cap: no surface overlays. */}
      {[-1, 0, 1].map((i) => (
        <Block key={i} position={[i * 1.89, -1.2, backZ + 0.11]}
          size={[1.85, 1.15, 0.22]} color="#737b60" />
      ))}
      <Block position={[0, -0.57, backZ + 0.23]} size={[5.79, 0.12, 0.44]}
        color="#737e61" metalness={0.35} />
      <Block position={[0, floorY + 0.105, backZ + 0.31]} size={[5.8, 0.21, 0.62]} color="#46553f" />
    </group></RangeSurfaces>
  )
}

export default memo(RangeFront)
