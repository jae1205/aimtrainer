import { memo } from 'react'
import { Block, Plaque, RangeSurfaces, RepeatedBlocks, Strip } from './RangeDetails'

const SIDE_BAYS = [-17.5, -14.5, -11.5, -8.5, -5.5, -2.5]
const BACK_PANELS = [-6.8, -3.4, 0, 3.4, 6.8]

const floorPanels = [-17.5, -13.5, -9.5, -5.5, -1.5].map((z) => ({
  position: [0, -1.96, z], size: [12.8, 0.06, 3.87],
}))
const backPanels = BACK_PANELS.map((x) => ({
  position: [x, 1.08, -19.37], size: [3.22, 4.45, 0.1],
}))
const sidePanels = [-1, 1].flatMap((side) => SIDE_BAYS.map((z) => ({
  position: [side * 8.31, 1.13, z], size: [0.12, 4.5, 2.76],
})))
const sidePosts = [-1, 1].flatMap((side) => SIDE_BAYS.slice(0, -1).map((z) => ({
  position: [side * 8.15, 1.22, z + 1.5], size: [0.12, 5.75, 0.15],
})))
const ceilingBaffles = SIDE_BAYS.map((z) => ({
  position: [0, 4.36, z + 0.95], size: [16.3, 0.24, 0.28],
}))

function RangeSwitchingArena() {
  return (
    <RangeSurfaces>
      <group name="range-front">
        {/* The same khaki mineral/metal palette as the other AIMFORGE bays. */}
        <Block position={[0, 1.25, -19.55]} size={[17, 6.5, 0.18]} color="#344238" receiveShadow={false} />
        {[-1, 1].map((side) => (
          <Block key={`wall-${side}`} position={[side * 8.5, 1.25, -9.5]}
            size={[0.2, 6.5, 20]} color="#505e52" receiveShadow={false} />
        ))}
        <Block position={[0, 1.25, 0.55]} size={[17, 6.5, 0.18]}
          color="#39483e" receiveShadow={false} />
        <Block position={[0, -2.09, -9.5]} size={[17, 0.18, 20]}
          color="#444c43" receiveShadow={false} />
        <Block position={[0, 4.58, -9.5]} size={[17, 0.16, 20]}
          color="#303934" receiveShadow={false} />

        <RepeatedBlocks items={floorPanels} color="#596457" receiveShadow={false} />
        <RepeatedBlocks items={backPanels} color="#566558" receiveShadow={false} />
        <RepeatedBlocks items={sidePanels} color="#6a7465" receiveShadow={false} />
        <RepeatedBlocks items={sidePosts} color="#86907d" metalness={0.27} receiveShadow={false} />
        <RepeatedBlocks items={ceilingBaffles} color="#3a433c" receiveShadow={false} />

        <Block position={[0, 3.87, -19.23]} size={[16.8, 0.58, 0.12]}
          color="#29372e" receiveShadow={false} />
        <Plaque position={[0, 3.88, -19.1]} width={2.8} height={0.4}
          title="AIMFORGE" subtitle="SWITCHING RANGE" />
        <Block position={[0, -1.44, -19.24]} size={[16.8, 0.24, 0.18]}
          color="#81906e" metalness={0.28} receiveShadow={false} />
        {[-1, 1].map((side) => (
          <group key={`trim-${side}`}>
            <Block position={[side * 8.16, -1.27, -9.5]} size={[0.22, 0.25, 19.8]}
              color="#7b896f" metalness={0.25} receiveShadow={false} />
            <Strip position={[side * 5.45, 4.46, -9.5]} size={[0.085, 0.035, 18.5]}
              color="#d8d2b8" />
            <Strip position={[side * 6.55, -1.905, -9.5]} size={[0.035, 0.01, 18.6]}
              color="#a99e74" />
          </group>
        ))}
      </group>
    </RangeSurfaces>
  )
}

export default memo(RangeSwitchingArena)
