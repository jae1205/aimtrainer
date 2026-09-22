# Toggle-to-aim transition

SCENE
- intent: Add restrained right-click toggle-to-aim to all three existing game viewmodels.
- deliverable: Additive AimControl rig and Aim clips in new GLBs; smooth 1.5x game zoom with release/cancel recovery.
- units: metres; axes: right-handed Z-up; preserve imported legacy armature scale.
- render: inherited technical review cameras/lights, 960x540, 60 fps, Aim frames 0-16.
- dynamic: yes; raise, settle, hold, reversible return; existing fire mechanics remain independent.

HIERARCHY
- collection/object naming: Existing AF_Pistol / AF_Revolver / AF_Banana and their named rigs.
- parent/child relationships: add non-deforming AimControl parent to existing root bones, preserving rest matrices.
- protected existing objects: startup Scene; source GLBs, previous exported rigs/checkpoints; all geometry, UVs, materials, fingers, recoil, cylinder and hammer motion.

ASSETS
- A01 pistol and hands | [EXISTING] detailed | legacy dimensions/anchors unchanged | RIG_Pistol | FPS hero.
- A02 revolver and hands | [EXISTING] detailed | legacy dimensions/anchors unchanged | RIG_Revolver | FPS hero.
- A03 banana and hands | [EXISTING] stylized | legacy dimensions/anchors unchanged | existing banana rig | novelty FPS hero.
- generation estimate/submission: no generation and no credit spend.

SHOT
- active camera: each existing named review camera; final review uses the same 75-degree camera as the game and computed 1.5x FOV.
- framing/lens/target: raise weapon toward center with muzzle below reticle; no added scope or claimed optic.
- foreground/subject/background: hands and weapon foreground, existing neutral technical background.

LOOK
- material roles/palette, UVs, roughness, displacement: [EXISTING], unchanged.
- world/background: preserve existing neutral review environment.

LIGHTING
- focal subject: weapon and continuous two-hand grip; inherited broad review lighting.
- environment route: [EXISTING], no HDR generation, new lights, atmosphere or grading.
- key/fill/reflections/color management: preserve accepted technical review setup.

MOTION
- fps/frame range: 60 fps, Aim 0-16; existing Shoot/Idle/Grip untouched.
- carrier: AimControl rotates/translates the complete hand/weapon assembly; game samples its authored curve independently of firing.
- rest/hold: Aim first frame identity; endpoint stable; release reverses smoothly without restarting the shot or cylinder phase.

ACCEPTANCE
- structural: original exports unchanged; each new GLB has AimControl and Aim plus original clips/materials.
- motion: no bind-pose flash, rapid aim/release remains continuous, firing and indexed cylinder still function.
- visual: inspect hip/mid/aim/fire/release on all models; no top-of-screen weapon or reticle blockage.
- interaction: right-click once to hold 1.5x projection-correct zoom, click again to release; blur, hidden tab, unlock and end round reset; normal left-click shooting unchanged.

refs_read: blender-scene, blender-scene-spec, blender-animation, blender-lighting-camera, blender-audit-finalize.

PLAN
1. [x] Read applicable modules and reconnect live Blender.
2. [x] Append existing scenes without replacing startup Scene; checkpoint.
3. [x] Inspect rigs/camera; add only AimControl and aim actions; export separate ADS GLBs.
4. [x] Wire toggle input, spring transition, projection zoom and authored pose overlay.
5. [x] Structural/motion/browser visual audit, recovery checkpoint and useful live review frame.

FINAL AUDIT — 2026-09-22
- Added one non-deforming AimControl parent to each accepted rig and one `Armature|Aim` clip. Previous source/runtime GLBs were not overwritten; new game exports are `pistol-ads.glb`, `revolver-ads.glb`, and `banana-ads.glb`.
- Node/Three.js audit compared the original Grip/Idle/Shoot poses at 20 samples per clip. Maximum world-position difference was under 0.000002 units for every weapon. All exports contain one scene, all prior meshes/textures, and exactly four clips.
- The authored Aim endpoint centers the visible sight picture, raises both hands, and reverses to the exact hip pose. The 1.5x zoom resolves to 54.18 degrees from the original 75-degree FOV.
- Toggle-input tests cover left-click isolation, one right click on, mouse release retaining aim, second right click off, held-button de-duplication, blur/hidden-tab/unlock/round reset, cleanup, and 30/60/144/240 fps spring convergence.
- Revolver rapid-fire audit retained six 60-degree cylinder indexes while the Aim carrier changed continuously; the original hammer/cylinder regression and the pistol/banana recoil regressions passed.
- Viewed Blender renders at pistol hip/mid/aim frames and production-component browser views for pistol, revolver, and banana aimed poses. No reticle obstruction or hand separation was visible.
- Targeted ESLint and production build passed. The existing bundle-size advisory remains.
- Recovery checkpoints: `before-aim-rigs-20260922.blend` plus one authored checkpoint per weapon under `art/ads/`.

PISTOL SIGHT ALIGNMENT REFINEMENT — 2026-09-22
- The default pistol alone receives a +0.0215 world-X AimControl endpoint correction so its modeled front/rear sight center, rather than its slightly offset rig origin, aligns with the reticle.
- Revolver and banana aim carriers remain byte-for-byte untouched by this refinement.
- Blender 960x540 and live Three.js 1280x720 aim renders place the front sight on the horizontal reticle center. Original pistol Grip/Idle/Shoot pose drift remains below 0.000002 units and all weapon motion regressions/build checks pass.
