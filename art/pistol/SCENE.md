# Pistol motion polish

SCENE
- intent: Refine the existing default pistol's FPS animation, restrained recoil and clean recovery.
- deliverable: Live Blender animation and game-ready pistol-rig.glb. Original source and banana unchanged.
- units: metres; axes: right-handed Z-up. Preserve legacy source rig units/336.502 scale; game applies 0.29 once.
- render: Cycles, 960x540 review, 60 fps, frame range 0-120.
- dynamic: yes, single-shot and idle.

HIERARCHY
- collection/object naming: AF_Pistol / RIG_Pistol, HERO_Pistol, HERO_PistolHands, ROOT_Pistol, CAM_PistolReview, LGT_PistolReview.
- parent/child relationships: root -> armature -> skinned gun and hands. Copy corrected armature data without modifying banana.
- protected existing objects: Entire AF_Banana and Scene, source Glock19, original public/Fps Rig.glb.

ASSETS
- A01 HERO_Pistol | [EXISTING] | detailed | legacy rest dimensions ~4.58x0.77x3.23 m | at rig origin | source orientation retained | gun Root bone | RIG_Pistol | hero.
- A02 HERO_PistolHands | [EXISTING] | stylized | original hand dimensions retained | at rig origin | source orientation | source skeleton | RIG_Pistol | first-person grip.
- generation estimate/submission state: none, no generation or credits.

SHOT
- active camera: CAM_PistolReview.
- framing/lens/target: game camera at 75 degree vertical FOV; default offset (0,-0.94,-0.9), rotation/scale unchanged.
- foreground, subject, background depth: hands emerge lower right, gun tip below crosshair; neutral review world.

LOOK
- material roles and palette: original pistol and glove materials unchanged.
- material route: [EXISTING]. UVs and texture scale unchanged. No displacement changes.
- dielectric/metallic / roughness/specular intent: original source.
- world/background: existing neutral review world copied.

LIGHTING
- focal subject: pistol silhouette; secondary: gripping hands; original glove recesses darkest.
- reference mood: technical animation review, not a lighting redesign.
- environment route: [EXISTING]; HDR not required.
- baseline, key, fill, motivation: inherited neutral World and broad review area source, unchanged.
- reflection strategy/gobos/atmosphere: none added.
- color management: inherited exposure/view transform.

MOTION
- 60 fps, Shoot frames 0-24 (0.4s); Idle 0-120 (2s).
- beats: quick small kick, distinct slide travel, controlled recovery, slight downward follow-through, exact rest at end.
- full-pose baking ensures fingers/slide cannot leak an old action's pose.
- rest poses and loops: Grip = Idle start = Shoot start/end. Idle seam matches exactly.

ACCEPTANCE
- structural: original scene/files unchanged, one rig/two skinned meshes, Grip/Idle/Shoot NLA clips.
- motion: measurable restrained kick, slide relative travel, exact recovery, stable repeated triggers.
- visual: view first/departure/peak/settle/end from matched camera; gun stays below center and hands maintain grip.
- lighting: existing technical lighting retained, materials verified in actual game renderer.

PLAN
1. Read scene/spec, animation, modeling, camera and audit references. Inspect live state.
2. Checkpoint and duplicate only the existing pistol/hand rig into separate scene.
3. Review unchanged silhouette/contact. No new geometry required.
4. Author full poses and independent slide cycle; export without changing protected source.
5. Audit sampled motion and game renderer; integrate default weapon path.

refs_read: blender-scene, blender-scene-spec, blender-animation, blender-modeling, blender-lighting-camera, blender-audit-finalize.

## Audit result

- Full-pose clips: Armature|Grip, Armature|Idle, Armature|Shoot. Shoot 0.4s at 60fps, Idle 2s. Explicit action-slot assignment used when sampling existing actions on copied armature.
- Retained 22% of the original arm recoil, with a separately timed slide cycle (peak 33ms, forward by 88ms). Original mesh, materials and banana files are unchanged.
- Viewed Blender renders at frames 0,2,4,12,24. Same ready pose at first/last frame; slide stroke readable and hands retain contact.
- GLB regression: 81 samples; screen-space gun tip stays below crosshair (minimum y 0.513), returns exactly to start; slide motion nonzero; Idle loop closes.
- Viewed production GunViewModel in browser fixture with repeated firing, and SkeetTrackingCanvas with actual range lighting/background. Browser error log empty. This checks rendering/animation; pointer-lock gameplay was not exercised by automation.
- Targeted ESLint, production build, and banana regression passed. Build reports the existing bundle-size advisory.
- Integrated public/models/pistol-rig.glb as default weapon; kept public/Fps Rig.glb untouched.
- Editable recovery copy: art/pistol/AF-Pistol-motion-checkpoint.blend. Live scene is AF_Pistol, Idle frame 0, matched review camera.
