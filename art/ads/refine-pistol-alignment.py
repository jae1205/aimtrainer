"""Refine only the default pistol ADS carrier so its iron sights are centered."""
import bpy
import math
from mathutils import Matrix, Vector, Quaternion

OUT = 'D:/aimforge/aimtrainer'
SCENE = 'AF_Pistol'
SIGHT_X = .0215

def rx(v): return Matrix.Rotation(v, 4, 'X')
def ry(v): return Matrix.Rotation(v, 4, 'Y')
def rz(v): return Matrix.Rotation(v, 4, 'Z')
def smooth(t): return t*t*t*(t*(t*6-15)+10)

s = bpy.data.scenes[SCENE]
bpy.context.window.scene = s
rig = next(o for o in s.objects if o.type == 'ARMATURE')
ad = rig.animation_data
tracks = list(ad.nla_tracks)
for track in tracks:
    track.mute = True

grip = next(t.strips[0].action for t in tracks if t.name == 'Armature|Grip')
aim_action = bpy.data.actions['Pistol_Aim']
ad.action = grip
ad.action_slot = grip.slots[0]
s.frame_set(0)
bpy.context.view_layer.update()

view = (Matrix.Translation((0, -.94, -.9)) @ ry(.06) @ rx(-.04) @ rz(-.02)
        @ Matrix.Scale(.29, 4) @ rx(.1) @ ry(math.pi*2.5) @ rx(-math.pi/2))
root = view @ rig.matrix_world @ rig.pose.bones['Root'].matrix.translation
target = root + Vector((-root.x + SIGHT_X, .14, -.1))
delta = Matrix.Translation(target) @ ry(-.06) @ rz(.02) @ Matrix.Translation(-root)
rig_view = view @ rig.matrix_world
local_delta = rig_view.inverted() @ delta @ rig_view
loc, rot, scale = local_delta.decompose()

ad.action = aim_action
ad.action_slot = aim_action.slots[0]
p = rig.pose.bones['AimControl']
p.rotation_mode = 'QUATERNION'
for frame in range(17):
    t = smooth(frame / 16)
    p.location = loc * t
    p.rotation_quaternion = Quaternion().slerp(rot, t)
    p.scale = (1, 1, 1)
    for path in ['location', 'rotation_quaternion', 'scale']:
        p.keyframe_insert(path, frame=frame, group='AimControl')

for layer in aim_action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for key in curve.keyframe_points:
                    key.interpolation = 'LINEAR'

bpy.ops.object.select_all(action='DESELECT')
for obj in s.objects:
    if obj.type in {'MESH', 'ARMATURE', 'EMPTY'}:
        obj.select_set(True)
bpy.context.view_layer.objects.active = rig
ad.action = None
for track in tracks:
    track.mute = False
bpy.ops.export_scene.gltf(
    filepath=f'{OUT}/public/models/pistol-ads.glb', export_format='GLB',
    use_selection=True, use_active_scene=True, export_animations=True,
    export_animation_mode='NLA_TRACKS', export_force_sampling=True,
    export_cameras=False, export_lights=False)

for track in tracks:
    track.mute = True
ad.action = aim_action
ad.action_slot = aim_action.slots[0]
s.frame_set(16)
bpy.context.view_layer.update()

result = {
    'scene': s.name,
    'weapon': 'pistol',
    'sight_x': SIGHT_X,
    'aim_anchor': list(target),
    'export': 'public/models/pistol-ads.glb',
}
