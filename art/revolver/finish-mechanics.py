"""Close remaining non-planar cut loops and soften the hammer cut seam."""
import bpy, bmesh
from mathutils import Vector
from mathutils.kdtree import KDTree

parts=['HERO_Revolver','HERO_RevolverCylinder','HERO_RevolverHammer']
report=[]
for name in parts:
    obj=bpy.data.objects[name];bm=bmesh.new();bm.from_mesh(obj.data)
    remaining=set(e for e in bm.edges if e.is_boundary);added=0
    while remaining:
        edge=remaining.pop();start,current=edge.verts[0],edge.verts[1];loop=[start,current]
        while current!=start:
            options=[e for e in current.link_edges if e in remaining]
            assert options,'Open cut contour needs manual inspection'
            edge=options[0];remaining.remove(edge);current=edge.other_vert(current)
            if current!=start:loop.append(current)
        center=bm.verts.new(sum((v.co for v in loop),Vector())/len(loop))
        for a,b in zip(loop,loop[1:]+loop[:1]):
            face=bm.faces.new((a,b,center));face.material_index=1;face.smooth=False;added+=1
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()
    obj.vertex_groups[0].add(list(range(len(obj.data.vertices))),1,'REPLACE')
    report.append((name,added))

hammer=bpy.data.objects['HERO_RevolverHammer']
if not hammer.get('cut_seam_finished'):
    bm=bmesh.new();bm.from_mesh(hammer.data);bm.verts.ensure_lookup_table()
    seam=[e for e in bm.edges if len(e.link_faces)==2 and e.link_faces[0].material_index!=e.link_faces[1].material_index]
    neighbors={}
    for edge in seam:
        a,b=edge.verts
        neighbors.setdefault(a,set()).add(b);neighbors.setdefault(b,set()).add(a)
    original={v:v.co.copy() for v in neighbors}
    for iteration in range(5):
        coords={v:v.co.lerp(sum((n.co for n in ns),Vector())/len(ns),.45) for v,ns in neighbors.items() if len(ns)==2}
        for v,co in coords.items():v.co=co
    body=bpy.data.objects['HERO_Revolver'].data
    kd=KDTree(len(body.vertices))
    for v in body.vertices:kd.insert(v.co,v.index)
    kd.balance()
    for v,co in original.items():
        for _,index,_ in kd.find_range(co,.0000002):body.vertices[index].co=v.co
    bm.to_mesh(hammer.data);bm.free();body.update()
    hammer['cut_seam_finished']=True
result={'closed':report,'hammer_seam_finished':True}
