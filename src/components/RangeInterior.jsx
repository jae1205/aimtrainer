import { memo } from 'react'
import { Block, Plaque, RangeSurfaces, RepeatedBlocks, Strip } from './RangeDetails'

const BAYS = [-10.2, -7.3, -4.4, -1.5]
const FLOOR_Y = -2

function RangeInterior() {
  const ceilingBaffles = BAYS.map((z) => ({
    position: [0, 4.12, z], size: [11.2, 0.38, 0.48],
  }))
  const columns = [-1, 1].flatMap((side) => BAYS.map((z) => ({
    position: [side * 5.69, 1.17, z], size: [0.31, 6.05, 0.3],
  })))
  const floorSegments = [-10.5, -8.05, -5.6, -3.15, -0.7].map((z) => ({
    position: [0, FLOOR_Y + 0.02, z], size: [4.25, 0.04, 2.415],
  }))
  return (
    <RangeSurfaces><group name="range-interior">
      {/* Solid floor panels have deliberate joints rather than coplanar overlay lines. */}
      <RepeatedBlocks items={floorSegments} color="#686a5b" receiveShadow={false} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Block position={[side * 2.18, -1.974, -6]} size={[0.055, 0.035, 11.9]}
            color="#a69765" metalness={0} receiveShadow={false} />
          <Block position={[side * 5.65, -1.78, -6]} size={[0.34, 0.44, 11.95]}
            color="#41433e" receiveShadow={false} />
          {/* Concealed linear lighting, no bright strips across the shooting field. */}
          {BAYS.map((z) => <group key={`fixture-${z}`}>
            <Block position={[side * 2.15, 4.28, z + 0.85]} size={[0.32, 0.16, 1.5]} color="#353a38" metalness={0.25} />
            <Strip position={[side * 2.15, 4.19, z + 0.85]} size={[0.22, 0.025, 1.34]} color="#e5dcc4" />
          </group>)}
          {[-8.75, -5.85, -2.95].map((z) => (
            <group key={z}>
              <Block position={[side * 5.88, 1.1, z]} size={[0.22, 4.85, 2.39]} color="#77766b" />
              <Block position={[side * 5.69, 2.25, z]} size={[0.16, 1.63, 2.18]} color="#3d423e" roughness={0.96} metalness={0} />
              <Block position={[side * 5.74, 0.13, z]} size={[0.055, 2.5, 2.18]} color="#626957" />
              <Block position={[side * 5.7, 1.36, z]} size={[0.025, 0.05, 2.18]} color="#929389" metalness={0.3} />
            </group>
          ))}
          {/* Upper service ducts and continuous hand-height metal rails. */}
          <Block position={[side * 5.36, 3.7, -6]} size={[0.46, 0.36, 11.85]} color="#747973" metalness={0.35} />
          <Block position={[side * 5.57, -0.77, -6]} size={[0.13, 0.12, 11.85]} color="#8c927a" metalness={0.45} />
        </group>
      ))}
      <RepeatedBlocks items={ceilingBaffles} color="#333835" />
      <RepeatedBlocks items={columns} color="#7b7b70" metalness={0.05} />
      {/* Ventilation grille slats share one instanced draw, with solid gaps. */}
      <RepeatedBlocks items={[-1, 1].flatMap((side) => BAYS.flatMap((z) =>
        Array.from({ length: 6 }, (_, i) => ({ position: [side * 5.36, 3.505, z + (i - 2.5) * 0.12], size: [0.34, 0.025, 0.055] }))
      ))} color="#292e2b" />

      {/* Restrained floor-distance markers sit on separate solid paint strips. */}
      {[-9.3, -6.85, -4.4].map((z) => (
        <group key={z}>
          {[-1, 1].map((side) => (
            <Block key={side} position={[side * 2.48, -1.972, z]}
              size={[0.38, 0.025, 0.075]} color="#a69c77" metalness={0} receiveShadow={false} />
          ))}
        </group>
      ))}

      {/* Low storage and a slim range-control pedestal provide scale. */}
      <group position={[-4.57, -1.43, -9.02]}>
        <Block position={[0, 0, 0]} size={[1.44, 1.07, 0.77]} color="#56664c" />
        <Block position={[0, 0.58, 0]} size={[1.53, 0.09, 0.88]} color="#90967e" metalness={0.3} />
        {[-0.35, 0.35].map((x) => (
          <group key={x}>
            <Block position={[x, -0.04, 0.4]} size={[0.66, 0.83, 0.055]} color="#43543e" />
            <Block position={[x + 0.21, 0.16, 0.45]} size={[0.035, 0.17, 0.04]} color="#b6b89e" metalness={0.5} />
          </group>
        ))}
      </group>
      <group position={[4.32, FLOOR_Y, -8.95]}>
        <Block position={[0, 0.075, 0]} size={[0.85, 0.15, 0.72]} color="#3f4b39" />
        <Block position={[0, 0.68, 0]} size={[0.2, 1.18, 0.22]} color="#788267" metalness={0.4} />
        <Block position={[0, 1.44, 0]} size={[0.95, 0.63, 0.16]} color="#75816a" />
        <Plaque position={[0, 1.45, 0.09]} width={0.81} height={0.48}
          title="READY" subtitle="RANGE CONTROL" />
      </group>

      <Block position={[0, 1.25, 0.2]} size={[12, 6.5, 0.4]} color="#4d5b46" />
      <Block position={[0, 0.3, -0.08]} size={[2.05, 4.4, 0.16]} color="#2b3a2e" />
      <Block position={[0, 2.61, -0.05]} size={[2.36, 0.16, 0.22]} color="#959981" />
      <Strip position={[0, 2.68, -0.18]} size={[1.8, 0.04, 0.03]} color="#d4d3ae" />
    </group></RangeSurfaces>
  )
}

export default memo(RangeInterior)
