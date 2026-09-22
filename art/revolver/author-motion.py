"""Run in connected Blender after the revolver has been fitted to its own rig.

Preserves source actions and other scenes; uses complete bone poses to avoid
bind-pose flashes. Cylinder/Hammer use independent rigid mechanical bones.
"""
import bpy
import math
from mathutils import Vector, Quaternion

s = bpy.data.scenes['AF_Revolver']
bpy.context.window.scene = s
r = bpy.data.objects['RIG_Revolver']
ad = r.animation_data
for track in ad.nla_tracks:
    track.mute = True
ad.action = bpy.data.actions['Pistol_Grip']
ad.action_slot = ad.action.slots[0]
s.frame_set(0)
for name in ['Cylinder', 'Hammer']:
    r.pose.bones[name].location = (0, 0, 0)
    r.pose.bones[name].rotation_quaternion = Quaternion()
    r.pose.bones[name].scale = (1, 1, 1)
r.pose.bones['Hammer'].rotation_quaternion = Quaternion((0, 1, 0), math.radians(25))
base = {p.name: (p.location.copy(), p.rotation_quaternion.copy(), p.scale.copy()) for p in r.pose.bones}

def smooth(x):
    x = max(0, min(1, x))
    return x*x*x*(x*(x*6-15)+10)

def sample(frame):
    ad.action = None
    for p in r.pose.bones:
        p.location, p.rotation_quaternion, p.scale = base[p.name]
    ad.action = bpy.data.actions['Source_Shoot']
    ad.action_slot = ad.action.slots[0]
    s.frame_set(int(frame), subframe=frame % 1)
    bpy.context.view_layer.update()
    return {p.name: (p.location.copy(), p.rotation_quaternion.copy(), p.scale.copy()) for p in r.pose.bones}

source_start = sample(0)
def source_time(t):
    stops = [(0, 0), (.05, 2), (.105, 4), (.24, 9), (.38, 12), (.5, 12)]
    for (ta, a), (tb, b) in zip(stops, stops[1:]):
        if t <= tb:
            return a + (b-a)*smooth((t-ta)/(tb-ta))
    return 12

def translate_pair(pose, world_delta):
    for name in ['UpperArm.L', 'UpperArm.R.001']:
        rest = r.data.bones[name].matrix_local.to_3x3()
        delta = (r.matrix_world.to_3x3() @ rest).inverted() @ world_delta
        loc, rot, scale = pose[name]
        pose[name] = (loc+delta, rot, scale)

clips = {'Grip': [base, base], 'Idle': [], 'Shoot': []}
for frame in range(121):
    phase = frame / 120 * 2 * math.pi
    pose = {n: (v[0].copy(), v[1].copy(), v[2].copy()) for n,v in base.items()}
    translate_pair(pose, Vector((.014*math.sin(phase), 0, .024*math.sin(phase))))
    clips['Idle'].append(pose)

for frame in range(31):
    t = frame / 60
    raw = sample(source_time(t))
    weight = .28 * (1-smooth((t-.14)/.27))
    pose = {}
    for name, (loc, rot, scale) in base.items():
        current = raw[name]
        if name in ['Slide', 'Barrel', 'Magazine', 'SlideCatch']:
            pose[name] = (loc.copy(), rot.copy(), scale.copy())
        else:
            pose[name] = (loc+(current[0]-source_start[name][0])*weight,
                          rot @ source_start[name][1].rotation_difference(current[1]).slerp(type(rot)(), 1-weight),
                          scale.copy())
    # A restrained downstroke below the ready pose, then a zero-velocity return.
    settle = math.sin(math.pi*max(0, min(1, (t-.13)/.37)))**2
    translate_pair(pose, Vector((-.035*settle, 0, -.055*settle)))
    if frame in [0, 30]:
        pose = {n: (v[0].copy(), v[1].copy(), v[2].copy()) for n,v in base.items()}
    # Strike immediately, then recock with the existing return stroke.
    cock = 1-smooth(t/.035)+smooth((t-.12)/.16)
    loc,rot,scale = base['Hammer']
    pose['Hammer'] = (loc.copy(), Quaternion((0,1,0), math.radians(25)*cock), scale.copy())
    loc,rot,scale = base['Cylinder']
    pose['Cylinder'] = (loc.copy(), Quaternion((0,1,0), math.pi/3*smooth((t-.012)/.12)), scale.copy())
    clips['Shoot'].append(pose)

ad.action = None
for track in list(ad.nla_tracks):
    ad.nla_tracks.remove(track)
for name, frames in clips.items():
    old = bpy.data.actions.get('Revolver_'+name)
    if old:
        old.name = 'Draft_'+old.name
    action = bpy.data.actions.new('Revolver_'+name)
    ad.action = action
    for frame, pose in enumerate(frames):
        for p in r.pose.bones:
            p.location, p.rotation_quaternion, p.scale = pose[p.name]
            for path in ['location', 'rotation_quaternion', 'scale']:
                p.keyframe_insert(path, frame=frame, group=p.name)
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for key in fc.keyframe_points:
                        key.interpolation = 'LINEAR'
    track = ad.nla_tracks.new()
    track.name = 'Armature|'+name
    track.strips.new(track.name, 0, action)
    track.mute = True
ad.action = bpy.data.actions['Revolver_Grip']
ad.action_slot = ad.action.slots[0]
s.frame_set(0)
result = {'clips': [(n, len(f)) for n,f in clips.items()], 'rig': r.name}
