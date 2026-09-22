# Revolver — scene passport

> This records the original v1 integration. The current cylinder/hammer update and final v2 audit are documented in [MECHANICS.md](MECHANICS.md).

- Intent: integrate the user-supplied textured revolver as an equippable AIMFORGE skin.
- Deliverables: separate editable Blender checkpoint, source GLB, animated game GLB.
- Existing route only; no AI generation or credits. Preserve supplied topology, UVs and PBR textures.
- Units: Blender Z-up metres in the inherited viewmodel authoring scale; runtime applies the existing 0.29 scale once.
- Protected: all AF_Pistol / AF_Banana / Scene objects and actions, original download and existing exports.
- New scene: AF_Revolver. ROOT_Revolver > RIG_Revolver > HERO_RevolverHands and HERO_Revolver.
- Hands: copied existing 41-bone rig and skinned mesh, no hand recoloring.
- Revolver: approximately 5.0 x 0.78 x 2.52 authoring units; muzzle +X, thickness Y, height Z. Grip anchored to existing weapon Root near [1.875, -3.674, 0.584]. Exact placement follows side/profile and FPS review.
- Camera: copy accepted pistol review camera, 75-degree vertical FPS view, lower-right weapon, unobstructed crosshair. No camera animation.
- Look: original metal/wood textures. Existing key light/world/exposure copied for comparable technical review, not new cinematic lighting.
- Motion: 60 fps, Grip 0–1, Idle 0–120 loop, Shoot 0–30. Light recoil at 3 frames, gentle downstroke/settle, exact ready pose at end. Revolver is a rigid weapon on Root; no semiautomatic slide movement. Supplied single fused mesh is not destructively cut into mechanical parts.
- Audit: inspect rest/peak/settle/end renders, grip contact and muzzle direction; ensure game lower-right framing, no clipping, closed loop, exact return, and rapid-fire compatibility.
- Scope: create only new scene/rig/actions/export and shop registry/UI wiring. Do not overwrite old blend files or publish to GitHub.

## Final audit — 2026-09-21

- Final checkpoint: `AF-Revolver-rigged.blend`, active AF_Revolver scene, Idle frame 0. The copy-save leaves the user's previously opened file path unchanged.
- Runtime export: `public/models/revolver-rig.glb`, 6,374,024 bytes; 41 bones; three clips (Grip 1/60 s, Idle 2 s, Shoot 0.5 s). No camera/lights/unrelated skins in GLB.
- Mesh: supplied 28,215 vertices / 46,054 faces unchanged; zero loose vertices. Texture-seam boundary vertices retained; no destructive topology cleanup. All three original 2048-square PBR maps embedded.
- Placed with uniform 2.65 authoring scale, Z rotation pi, translation [3.43, -3.674, 0.68], then converted into the existing Root bone's bind space. Only one Root weight per revolver vertex; shared hand skeleton retained.
- Viewed Blender profile and motion samples 0/2/3/9/20/30, plus actual production GunViewModel render and SkeetTrackingCanvas range render.
- Automated Three.js verification: 91 motion samples, exact rest return, seamless idle, valid skin registry and asset paths; no near-plane crossing, above-head placement, or crosshair obstruction. Peak weapon envelope: x 0.626–0.845, top y 0.508 (top-origin screen coordinates).
- Existing pistol and banana regression checks pass. Production build and touched-source ESLint pass; existing large-chunk build warning remains.
- Shop: 3D source preview, exclusive equip, default-weapon restoration, persisted local selection. Browser test switched banana → revolver and reloaded; revolver remained selected.
- Firing and rapid-fire tested through `art/banana/viewmodel-review.html`, which uses the production weapon component. Full pointer-lock gameplay was not automated. Skeet keeps the existing fixed grip behavior; firing animation is Gridshot-only.
- No new credits, generation, purchases, or GitHub publication. Original source SHA256 remains B7BD791253913A45E56F351C5C2F3F12FEB1FACFCA86890EF5E1ADBC909C9CE3.
