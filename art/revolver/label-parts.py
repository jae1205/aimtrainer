"""Non-destructive semantic face labeling by seeded surface geodesics.

Weld UV seams in an analysis-only BMesh, then flood across the surface with
dihedral-weighted distances. Explicit surface landmarks identify components;
no coordinate-box face/vertex deletion. Inspect the colored boundary pass
before using these labels to separate the working mesh.
"""
import bpy, bmesh, math, heapq
from mathutils import Matrix, Vector
from mathutils.kdtree import KDTree

s = bpy.data.scenes['AF_Revolver']; bpy.context.window.scene = s
r = bpy.data.objects['RIG_Revolver']; o = bpy.data.objects['HERO_Revolver']
r.animation_data.action = bpy.data.actions['Revolver_Grip']
r.animation_data.action_slot = r.animation_data.action.slots[0]
s.frame_set(0); bpy.context.view_layer.update()
W = Matrix.Translation((3.43, -3.674, .68)) @ Matrix.Rotation(math.pi, 4, 'Z') @ Matrix.Scale(2.65, 4)
M = W.inverted() @ r.matrix_world @ r.pose.bones['Root'].matrix @ r.data.bones['Root'].matrix_local.inverted()
bm = bmesh.new(); bm.from_mesh(o.data)
layer = bm.faces.layers.int.new('original_face')
for f in bm.faces: f[layer] = f.index
for v in bm.verts: v.co = M @ v.co
bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.00002)
bm.faces.ensure_lookup_table(); bm.faces.index_update(); bm.normal_update()
faces = list(bm.faces); centers = [f.calc_center_median() for f in faces]
kd = KDTree(len(faces))
for i, p in enumerate(centers): kd.insert(p, i)
kd.balance()
landmarks = {
    1: [(x,y,z) for x in [-.02,.10,.21] for y,z in [(-.143,.22),(.147,.22),(0,.355),(0,.086)]],
    2: [(.49,-.023,.337),(.49,.023,.337),(.576,0,.377),(.535,0,.377)],
    0: [(-.6,0,.29),(-.25,0,.27),(-.13,-.07,.31),(.08,0,.413),(.27,0,.410),
        (.1,-.070,.010),(.1,.070,.010),(.31,-.072,.22),(.31,.075,.22),
        (.42,-.08,.27),(.42,.083,.27),(.53,0,.17),(.68,0,-.2),(.16,0,-.18),
        (-.1,0,.025),(.3,0,-.10),(.41,0,.407),
        (-.20,0,.33),(-.12,0,.29),(-.10,0,.20),(-.08,0,.383)]
}
distance = [float('inf')]*len(faces); labels = [0]*len(faces); queue=[]
seed_info=[]
for label, points in landmarks.items():
    for point in points:
        co, i, d = kd.find(Vector(point))
        distance[i]=0;labels[i]=label;heapq.heappush(queue,(0,i,label))
        seed_info.append((label,i,list(co)))
while queue:
    dist, i, label = heapq.heappop(queue)
    if dist != distance[i] or label != labels[i]: continue
    f = faces[i]
    for edge in f.edges:
        for other in edge.link_faces:
            j = other.index
            if j == i: continue
            # Surface discontinuities are natural component boundaries.
            bend = 1-max(-1,min(1,f.normal.dot(other.normal)))
            cost = (centers[i]-centers[j]).length*(1+30*bend)
            next_dist=dist+cost
            if next_dist<distance[j]:
                distance[j]=next_dist;labels[j]=label;heapq.heappush(queue,(next_dist,j,label))
attribute = o.data.attributes.get('mechanical_part') or o.data.attributes.new('mechanical_part','INT','FACE')
for f in faces: attribute.data[f[layer]].value=labels[f.index]
# Debug materials only; original PBR is retained in slot zero.
for name,color in [('AUDIT_Cylinder',(.8,.05,.015,1)),('AUDIT_Hammer',(.03,.5,.9,1))]:
    mat=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes=True;mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=color
    if name not in [m.name for m in o.data.materials]:o.data.materials.append(mat)
for poly in o.data.polygons:poly.material_index=attribute.data[poly.index].value
counts={str(label):labels.count(label) for label in [0,1,2]}
bounds={}
for label in [1,2]:
    pts=[v.co for f in faces if labels[f.index]==label for v in f.verts]
    bounds[str(label)]=[[min(p[d] for p in pts) for d in range(3)],[max(p[d] for p in pts) for d in range(3)]]
bm.free()
result={'counts':counts,'bounds':bounds,'original_faces':len(o.data.polygons),'seed_count':len(seed_info)}
