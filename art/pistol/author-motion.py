"""Run inside the connected Blender. Never modifies the source/banana actions."""
import bpy
import math
from mathutils import Vector

s = bpy.data.scenes['AF_Pistol']
bpy.context.window.scene = s
r = bpy.data.objects['RIG_Pistol']
ad = r.animation_data
ad.action = bpy.data.actions['Armature|Grip']
ad.action_slot = ad.action.slots[0]
s.frame_set(0)
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
mechanical = {}
for name in ['Slide', 'Barrel']:
    mechanical[name] = max((sample(f)[name][0] - source_start[name][0] for f in range(13)), key=lambda v: v.length)

def source_time(t):
    stops = [(0, 0), (.045, 2), (.09, 4), (.18, 8), (.30, 12), (.40, 12)]
    for (ta, a), (tb, b) in zip(stops, stops[1:]):
        if t <= tb:
            return a + (b-a)*smooth((t-ta)/(tb-ta))
    return 12

clips = {'Grip': [base, base], 'Idle': [], 'Shoot': []}
for frame in range(121):
    phase = frame / 120 * 2 * math.pi
    pose = {n: (v[0].copy(), v[1].copy(), v[2].copy()) for n,v in base.items()}
    for name in ['UpperArm.L', 'UpperArm.R.001']:
        rest = r.data.bones[name].matrix_local.to_3x3()
        delta = (r.matrix_world.to_3x3() @ rest).inverted() @ Vector((.018*math.sin(phase), 0, .028*math.sin(phase)))
        loc,rot,scale = pose[name]
        pose[name] = (loc+delta,rot,scale)
    clips['Idle'].append(pose)

for frame in range(25):
    t = frame / 60
    raw = sample(source_time(t))
    # More restrained arm kick, but retain readable mechanical motion.
    recovery = 1-smooth((t-.12)/.22)
    pose = {}
    for name,(loc,rot,scale) in base.items():
        current = raw[name]
        weight = .22 * recovery
        pose[name] = (loc + (current[0]-source_start[name][0])*weight,
                      rot @ source_start[name][1].rotation_difference(current[1]).slerp(type(rot)(), 1-weight),
                      scale.copy())
    slide = smooth(t/.033) if t < .033 else 1-smooth((t-.033)/.055)
    for name,amount in [('Slide',.8),('Barrel',.4)]:
        loc,rot,scale = base[name]
        pose[name] = (loc + mechanical[name]*slide*amount,rot.copy(),scale.copy())
    if frame in [0,24]:
        pose = {n: (v[0].copy(),v[1].copy(),v[2].copy()) for n,v in base.items()}
    clips['Shoot'].append(pose)

ad.action = None
for track in list(ad.nla_tracks):
    ad.nla_tracks.remove(track)
for name,frames in clips.items():
    old = bpy.data.actions.get('Pistol_'+name)
    if old:
        old.name = 'Draft_'+old.name
    action = bpy.data.actions.new('Pistol_'+name)
    ad.action = action
    for frame,pose in enumerate(frames):
        for p in r.pose.bones:
            p.location,p.rotation_quaternion,p.scale = pose[p.name]
            for path in ['location','rotation_quaternion','scale']:
                p.keyframe_insert(path,frame=frame,group=p.name)
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for k in fc.keyframe_points:
                        k.interpolation = 'LINEAR'
    track = ad.nla_tracks.new()
    track.name = 'Armature|'+name
    track.strips.new(track.name,0,action)
    track.mute = True
ad.action = bpy.data.actions['Pistol_Grip']
ad.action_slot = ad.action.slots[0]
s.frame_set(0)
result = {'clips': [(n,len(f)) for n,f in clips.items()], 'slide_travel_local': list(mechanical['Slide'])}
