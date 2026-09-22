# Revolver mechanical-animation passport

SCENE
- Intent: independent cylinder indexing and hammer cock/strike on the existing game prop, not a functional weapon design.
- Deliverable: updated animated GLB and recoverable editable Blender checkpoint.
- Units: inherited Z-up authoring scale, unchanged runtime scale 0.29.
- Render: existing Cycles, 960x540, 60 fps, 0–120; dynamic.
- refs_read: blender-scene, blender-scene-spec, blender-modeling, blender-animation, blender-lookdev, blender-lighting-camera, blender-audit-finalize.

HIERARCHY
- Keep AF_Revolver / ROOT_Revolver / RIG_Revolver and the existing hands.
- Add Cylinder and Hammer bones under weapon Root and independent semantic mesh parts.
- Protected: original downloaded/source GLB, existing v1 checkpoint, pistol/banana scenes and exports, hands/materials/camera/viewmodel position.
- Allowed modifications: working revolver mesh (topology-based part separation/caps), revolver rig/actions/runtime export; cylinder-phase handling in runtime and regression tests.

ASSETS
- A01 supplied revolver shell [EXISTING], textured hero: retain silhouette/UV/material.
- A02 cylinder surface [EXISTING], approximately 0.35x0.29x0.29 source units; source axis X near y=0.002,z=0.22. Connected surface/normal segmentation; no box-select deletion. Close separation rims as needed.
- A03 hammer surface [EXISTING], source rear spur near x=0.50,z=0.35; lateral pivot Y near x=0.44,z=0.26. Separate across its narrow neck with topology-aware segmentation.
- No generation/spend. Any new interior closure is local topology repair, not replacement of the textured asset.

SHOT
- Preserve FPS camera. Temporary side inspection camera is restored after each inspection.
- Main framing: lower-right, stable hands, no crosshair obstruction.

LOOK
- Existing PBR maps and UVs. Interior cut caps use matching dark metal only if necessary.
- Preserve world, exposure, key light and material contrast.

LIGHTING
- Existing technical review lighting retained; no new cinematic lighting rig.
- Moving highlights should reveal rotation without changing global exposure.

MOTION
- Existing restrained 0.5-second recoil retained.
- Cylinder: one forward 60-degree index per shot; never blend backwards into idle. Runtime retains the cumulative cylinder phase for interrupted shots.
- Hammer: ready/cocked pose, quick strike, controlled recocking during recovery; rotational hinge only, no translation drift.
- Fingers and gun/hand anchor remain unchanged. Idle loop closes; hammer returns to its ready pose.

ACCEPTANCE
- Structural: two independent rigid parts/bones, intact surrounding frame, original source unchanged, textures present.
- Motion: independently measured cylinder/hammer movement relative to Root, fixed pivots, continuous repeated shots, no cylinder rewind.
- Visual: side and FPS rest/strike/index/recock/settle samples; no holes, duplicated stationary parts, tears, floating geometry or hand separation.

TODO
- [x] Read matching modules; inspect live scene and connectivity (one welded surface).
- [x] A: label and inspect semantic part boundaries.
- [x] B: checkpoint before geometry edits.
- [x] C/D: separate/cap/rig and inspect silhouettes; author mechanical clips.
- [x] E: export, measure, view motion samples, integrate and verify runtime.

FINAL AUDIT — 2026-09-21
- Final editable checkpoint: `AF-Revolver-mechanics.blend`; original `AF-Revolver-rigged.blend` preserved. Previous runtime GLB also retained as `revolver-rig-v1.glb`.
- New separate objects: HERO_RevolverCylinder, HERO_RevolverHammer. Added Cylinder/Hammer bones (43 total). Body cut surfaces closed; all three meshes have zero open or non-manifold edges. No unrelated objects deleted.
- Part labels came from geodesic surface propagation over seam-welded analysis topology with normal-discontinuity costs. Reviewed colored labels before separation; original texture/UV retained. Applied dark-metal interior closure and softened only the hammer split seam.
- Export: `public/models/revolver-rig.glb`, 6,537,712 bytes, three clips, no camera/light. Runtime cache version 2. The 60-degree indexing curve is baked in Shoot and sampled by the runtime phase keeper after the animation mixer.
- Hammer: 25-degree strike/recock, fixed pivot. Cylinder: 60-degree forward index, fixed axle. Body/hands retain original 0.5 s light recoil and their exact final pose. Cylinder intentionally ends one chamber ahead.
- Viewed FPS frames 0/1/3/10/20/30 and side 0/3/10. Side debug camera cropped the barrel during peak recoil; the unchanged delivery FPS camera passed complete motion-envelope checks.
- Node/Three.js checks: 91 samples; cylinder 60.000002 degrees, hammer 24.999994 degrees; no near-plane/crosshair intrusion. Rapid-fire tests at 50/117/500 ms retain all six indexes with no reversal. Pistol/banana regression checks pass.
- Browser test: actual production GunViewModel, six shots at 120 ms; visible telemetry reported accumulated cylinder 360.0 degrees, reverse-motion frames 0, hammer travel 25.0 degrees; viewed firing and recovered poses. QA page: `art/revolver/mechanics-review.html`.
- Build and touched-source ESLint pass. Existing large-chunk build warning remains. Full pointer-lock gameplay was not automated; mechanical rendering was verified through the production component.
- Final active scene AF_Revolver, CAM_RevolverReview, Revolver_Idle at frame 0. Source-file SHA256 unchanged. No paid generation or GitHub publishing.
