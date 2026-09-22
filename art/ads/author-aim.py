"""Author independent hand/weapon aim carriers in the connected Blender session.

Existing GLBs and scene geometry remain untouched. Run once after appending the
three accepted scenes. Exports are separate *-ads.glb files for safe comparison.
"""
import bpy
import math
from mathutils import Matrix, Vector, Quaternion

OUT = 'D:/aimforge/aimtrainer'
SPECS = [('pistol', 'AF_Pistol', .14, (0, -.94, -.9)),
         ('revolver', 'AF_Revolver', .21, (0, -.94, -.9)),
         ('banana', 'AF_Banana', .22, (0, -1.08, -1))]
SIGHT_X = {'pistol': .0215, 'revolver': 0, 'banana': 0}

def rx(v): return Matrix.Rotation(v, 4, 'X')
def ry(v): return Matrix.Rotation(v, 4, 'Y')
def rz(v): return Matrix.Rotation(v, 4, 'Z')
def smooth(t): return t*t*t*(t*(t*6-15)+10)

reports = []
for slug, name, lift, offset in SPECS:
    s = bpy.data.scenes[name]
    original_fps = s.render.fps
    bpy.context.window.scene = s
    rig = next(o for o in s.objects if o.type == 'ARMATURE')
    assert 'AimControl' not in rig.data.bones, 'Already authored; inspect before rerunning'
    ad = rig.animation_data
    for track in ad.nla_tracks: track.mute = True
    tracks = list(ad.nla_tracks)
    grip = next(t.strips[0].action for t in tracks if t.name == 'Armature|Grip')
    ad.action = grip
    ad.action_slot = grip.slots[0]
    s.frame_set(0)
    bpy.context.view_layer.update()
    base = {p.name: (p.location.copy(), p.rotation_quaternion.copy(), p.scale.copy()) for p in rig.pose.bones}
    # Exact transform used by the production viewmodel, including Blender -> glTF axes.
    view = Matrix.Translation(offset) @ ry(.06) @ rx(-.04) @ rz(-.02) @ Matrix.Scale(.29, 4) @ rx(.1) @ ry(math.pi*2.5) @ rx(-math.pi/2)
    root = view @ rig.matrix_world @ rig.pose.bones['Root'].matrix.translation
    # The default pistol's modeled iron sights sit slightly left of its Root.
    # Center the sight picture rather than the rig origin; other weapons were
    # already optically centered and intentionally remain unchanged.
    target = root + Vector((-root.x + SIGHT_X[slug], lift, -.1))
    delta = Matrix.Translation(target) @ ry(-.06) @ rz(.02) @ Matrix.Translation(-root)
    rig_view = view @ rig.matrix_world
    local_delta = rig_view.inverted() @ delta @ rig_view
    loc, rot, scale = local_delta.decompose()

    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    roots = [b for b in rig.data.edit_bones if b.parent is None]
    aim = rig.data.edit_bones.new('AimControl')
    aim.head = (0, 0, 0)
    aim.tail = (0, .006, 0)
    aim.use_deform = False
    for bone in roots: bone.parent = aim
    bpy.ops.object.mode_set(mode='OBJECT')
    p = rig.pose.bones['AimControl']
    p.rotation_mode = 'QUATERNION'

    # Explicit identity in existing clips prevents unkeyed-pose leakage in glTF baking.
    for track in tracks:
        action = track.strips[0].action
        ad.action = action
        ad.action_slot = action.slots[0]
        p.location = (0, 0, 0)
        p.rotation_quaternion = Quaternion()
        p.scale = (1, 1, 1)
        for frame in action.frame_range:
            for path in ['location', 'rotation_quaternion', 'scale']:
                p.keyframe_insert(path, frame=frame, group='AimControl')

    action = bpy.data.actions.new(slug.title() + '_Aim')
    ad.action = action
    for frame in range(17):
        for bone_name, pose in base.items():
            bone = rig.pose.bones[bone_name]
            bone.location, bone.rotation_quaternion, bone.scale = pose
            for path in ['location', 'rotation_quaternion', 'scale']:
                bone.keyframe_insert(path, frame=frame, group=bone_name)
        t = smooth(frame/16)
        p.location = loc * t
        p.rotation_quaternion = Quaternion().slerp(rot, t)
        p.scale = (1, 1, 1)
        for path in ['location', 'rotation_quaternion', 'scale']:
            p.keyframe_insert(path, frame=frame, group='AimControl')
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points: key.interpolation = 'LINEAR'
    track = ad.nla_tracks.new()
    track.name = 'Armature|Aim'
    track.strips.new(track.name, 0, action)
    track.mute = True
    ad.action = grip
    ad.action_slot = grip.slots[0]
    s.frame_set(0)

    # Add a matched technical camera; preserve the accepted scene's old camera and lighting.
    camera_data = bpy.data.cameras.new('CAM_ADS_' + slug)
    camera = bpy.data.objects.new(camera_data.name, camera_data)
    s.collection.objects.link(camera)
    inv = view.inverted()
    camera.location = inv.translation
    camera.rotation_euler = inv.to_quaternion().to_euler()
    camera_data.sensor_fit = 'VERTICAL'
    camera_data.sensor_height = 24
    camera_data.lens = 12 / math.tan(math.radians(75)/2)
    camera_data.clip_start = .05/.29
    camera_data.clip_end = 100
    s.camera = camera
    s.render.resolution_x = 960
    s.render.resolution_y = 540
    s.render.resolution_percentage = 100
    s.render.fps = original_fps
    s.frame_start = 0
    s.frame_end = 120

    bpy.ops.object.select_all(action='DESELECT')
    for obj in s.objects:
        if obj.type in {'MESH', 'ARMATURE', 'EMPTY'}: obj.select_set(True)
    bpy.context.view_layer.objects.active = rig
    ad.action = None
    for track in ad.nla_tracks: track.mute = False
    bpy.ops.export_scene.gltf(filepath=f'{OUT}/public/models/{slug}-ads.glb',
        export_format='GLB', use_selection=True, use_active_scene=True, export_animations=True,
        export_animation_mode='NLA_TRACKS', export_force_sampling=True,
        export_cameras=False, export_lights=False)
    for track in ad.nla_tracks: track.mute = True
    ad.action = grip
    ad.action_slot = grip.slots[0]
    s.frame_set(0)
    reports.append({'id': slug, 'bone_count': len(rig.data.bones),
                    'aim_duration': 16/60, 'hip_anchor': list(root), 'aim_anchor': list(target),
                    'camera': camera.name, 'export': f'{slug}-ads.glb'})

result = {'authored': reports}
