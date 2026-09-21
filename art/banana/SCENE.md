# Banana viewmodel

SCENE: A novelty banana weapon for AIMFORGE. Preserve source assets. Blender Z-up, original rig scale, 30 fps. Deliver editable blend and animated GLB.
HIERARCHY: New AF_Banana scene. Existing default scene protected. Existing FPS armature and hands retained; supplied banana replaces gun only in exported scene.
ASSETS: [EXISTING] public/Fps Rig.glb hands, skeleton and animations. [EXISTING] public/models/banana-source.glb textured banana. Fit banana to original gun extent and bind to Root.
SHOT: Review side/three-quarter, then game camera framing. Game uses unchanged original viewmodel transform.
LOOK: Preserve supplied banana PBR maps and original hand materials.
LIGHTING: Neutral review lighting only; no baked shadows.
MOTION: Retain Grip, Idle and Reload. Author banana Shoot recoil and smooth recovery, using original hand pose as foundation.
ACCEPTANCE: Embedded clips, hands and banana follow same rig; original files untouched; shop equip persists; production build passes. Inspect render and exported structure.
PLAN: Checkpoint; import into task scene; fit and rig banana; author recoil; export active scene; connect shop selection; validate.
REFS_READ: blender-scene, blender-animation, blender-modeling, blender-lookdev, blender-audit-finalize, blender-scene-spec, blender-lighting-camera.

## 2026-09-19 framing repair

- Root cause: imported upper-arm animation translations placed both arm chains at incorrect world-space heights. Corrected each root translation against the original GLB's evaluated Grip pose, in its rest-bone coordinate system.
- Re-baked complete Grip, Idle and Shoot poses so unkeyed fingers/weapon bones cannot retain a different NLA pose. Start/end Shoot pose matches Idle. Recoil amplitude reduced to 24%; duration 0.75 s, 24 fps. Banana has no reload clip because its hand-held prop has no magazine.
- Banana-only runtime offset: (0, -1.08, -1.0). Existing pistol offset, scale and rotation unchanged.
- ReviewCamera now matches the runtime camera-relative view transform, 75-degree vertical FOV, 1280 x 720. Review lighting unchanged. Recovery copy: AF-Banana-framing-fixed.blend. Original supplied assets preserved.
- Viewed Blender renders at frames 0, 2, 5, 12 and 18. Viewed the real GunViewModel and SkeetTrackingCanvas components in viewmodel-review.html, including repeated shot triggers.
- Node regression test: 61 samples, banana tip stays in lower-right viewport, near plane never intersects banana, shot returns to initial position (zero measured displacement). Held stem may extend below viewport together with hand/forearm, intentionally.
- Browser pointer lock was unavailable in automation; gameplay input itself not verified. Model rendering/animation were checked in the dedicated fixture using production components.
- Production build and targeted ESLint passed. No source rig or background/target changes in this repair.
