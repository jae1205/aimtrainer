"""Separate reviewed semantic face labels, close cut rims, add rigid bones.

Run only after viewing the label pass. Source mesh is kept as a fake-user
datablock; the v1 .blend checkpoint also remains untouched.
"""
import bpy, bmesh, math
from mathutils import Matrix, Vector

s=bpy.data.scenes['AF_Revolver'];bpy.context.window.scene=s
r=bpy.data.objects['RIG_Revolver'];body=bpy.data.objects['HERO_Revolver']
assert 'HERO_RevolverCylinder' not in bpy.data.objects, 'Already separated; inspect before rerunning'
source=body.data
assert source.attributes.get('mechanical_part')
source.name='SOURCE_Revolver_Unsegmented';source.use_fake_user=True
W=Matrix.Translation((3.43,-3.674,.68)) @ Matrix.Rotation(math.pi,4,'Z') @ Matrix.Scale(2.65,4)
M=W.inverted() @ r.matrix_world @ r.pose.bones['Root'].matrix @ r.data.bones['Root'].matrix_local.inverted()
source_to_bind=M.inverted()
interior=bpy.data.materials.get('Revolver_CutMetal') or bpy.data.materials.new('Revolver_CutMetal')
interior.use_nodes=True
bsdf=interior.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value=(.045,.05,.052,1)
bsdf.inputs['Metallic'].default_value=.75;bsdf.inputs['Roughness'].default_value=.42
stats=[]
for label,name in [(0,'HERO_Revolver'),(1,'HERO_RevolverCylinder'),(2,'HERO_RevolverHammer')]:
    bm=bmesh.new();bm.from_mesh(source)
    part_layer=bm.faces.layers.int.get('mechanical_part')
    assert part_layer
    # Weld only duplicate seam positions; UV coordinates remain per-loop.
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0000001)
    remove=[f for f in bm.faces if f[part_layer]!=label]
    kept=len(bm.faces)-len(remove)
    bmesh.ops.delete(bm,geom=remove,context='FACES')
    loose=[v for v in bm.verts if not v.link_faces]
    if loose:bmesh.ops.delete(bm,geom=loose,context='VERTS')
    for f in bm.faces:f.material_index=0
    boundary=[e for e in bm.edges if e.is_boundary]
    caps=bmesh.ops.holes_fill(bm,edges=boundary,sides=0).get('faces',[]) if boundary else []
    for f in caps:f.material_index=1;f.smooth=False
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    data=bpy.data.meshes.new('MESH_'+name.removeprefix('HERO_'))
    bm.to_mesh(data);bm.free();data.materials.append(source.materials[0]);data.materials.append(interior)
    if label==0:obj=body;obj.data=data
    else:
        obj=bpy.data.objects.new(name,data);s.collection.objects.link(obj)
        obj.parent=r;obj.matrix_parent_inverse=Matrix.Identity(4);obj.matrix_basis=Matrix.Identity(4)
        mod=obj.modifiers.new('Revolver skin','ARMATURE');mod.object=r
    obj.vertex_groups.clear();group=obj.vertex_groups.new(name={0:'Root',1:'Cylinder',2:'Hammer'}[label])
    group.add(list(range(len(data.vertices))),1,'REPLACE')
    stats.append({'object':name,'retained_faces':kept,'cap_faces':len(caps),'vertices':len(data.vertices),'polygons':len(data.polygons)})

bpy.ops.object.select_all(action='DESELECT');r.select_set(True);bpy.context.view_layer.objects.active=r
bpy.ops.object.mode_set(mode='EDIT')
for name,pivot,axis in [('Cylinder',(.09,.00068,.23054),(.2,0,0)),('Hammer',(.485,.002,.235),(0,.1,0))]:
    bone=r.data.edit_bones.new(name);bone.parent=r.data.edit_bones['Root']
    bone.head=source_to_bind@Vector(pivot);bone.tail=source_to_bind@(Vector(pivot)+Vector(axis))
    bone.use_deform=True;bone.use_connect=False
bpy.ops.object.mode_set(mode='OBJECT')
for name in ['Cylinder','Hammer']:r.pose.bones[name].rotation_mode='QUATERNION'
s.frame_set(0);bpy.context.view_layer.update()
result={'parts':stats,'bones':len(r.data.bones),'source_datablock':source.name}
