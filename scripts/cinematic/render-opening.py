"""Original botanical film, Blender 4.3+, entirely built from project art and geometry.
blender -b -t 5 --python scripts/cinematic/render-opening.py -- --output /tmp/herbier-film --preview 1,180,290 --size 540
Render all frames: omit --preview (24 fps, 356 frames); optional --start/--end resume ranges.
The generated scene/model/animation are dedicated under CC0. Existing fonts/art keep their notices.
"""
import bpy, math, random, argparse, sys, time
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--output',default='/tmp/herbier-film');p.add_argument('--preview');p.add_argument('--size',type=int,default=720);p.add_argument('--samples',type=int,default=16);p.add_argument('--start',type=int,default=1);p.add_argument('--end',type=int,default=356)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
random.seed(4817);bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.device='CPU';s.cycles.samples=a.samples;s.cycles.use_denoising=False
s.cycles.use_adaptive_sampling=True;s.cycles.adaptive_threshold=.09;s.cycles.max_bounces=3;s.cycles.diffuse_bounces=1;s.cycles.glossy_bounces=1;s.cycles.transmission_bounces=3;s.cycles.transparent_max_bounces=4;s.cycles.sample_clamp_indirect=2
s.render.resolution_x=a.size;s.render.resolution_y=round(a.size*16/9);s.render.resolution_percentage=100;s.render.fps=24;s.frame_start=1;s.frame_end=356
s.render.image_settings.file_format='OPEN_EXR';s.render.image_settings.color_depth='16';s.render.image_settings.color_mode='RGB';s.render.film_transparent=False
s.render.use_persistent_data=True;s.render.use_motion_blur=not bool(a.preview);s.render.motion_blur_shutter=.28
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=-.25
s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.19,.24,.19,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.35

def material(name,color,rough=.5,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;return m

def texture(m,scale,amount=.08,dist=.05):
 n=m.node_tree.nodes;l=m.node_tree.links
 # Cached texture inputs preserve fine grain without evaluating fractal noise on every ray.
 file='leather.png' if 'calfskin' in m.name else 'paper.png'
 tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.get(file) or bpy.data.images.load(str(R/'assets/prologue'/file));tex.image.colorspace_settings.name='Non-Color'
 co=n.new('ShaderNodeTexCoord');l.new(co.outputs['Generated'],tex.inputs['Vector'])
 bw=n.new('ShaderNodeRGBToBW');l.new(tex.outputs['Color'],bw.inputs[0])
 noise=n.new('ShaderNodeMath');noise.operation='MULTIPLY';noise.inputs[1].default_value=3 if file=='leather.png' else 1;l.new(bw.outputs[0],noise.inputs[0])
 bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=amount;bump.inputs['Distance'].default_value=dist;l.new(noise.outputs[0],bump.inputs['Height']);l.new(bump.outputs['Normal'],n.get('Principled BSDF').inputs['Normal']);return noise
leather=material('Forest green, hand-worn calfskin',(.015,.04,.022),.6)
n=leather.node_tree.nodes;l=leather.node_tree.links
co=n.new('ShaderNodeTexCoord')
def pbr_image(nodes,links,file,coords,color=True):
 tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(R/'art/cinematic/textures'/file));tex.image.colorspace_settings.name='sRGB' if color else 'Non-Color';links.new(coords,tex.inputs['Vector']);return tex
photo=pbr_image(n,l,'leather-diffuse.jpg',co.outputs['Generated']);bw=n.new('ShaderNodeRGBToBW');l.new(photo.outputs['Color'],bw.inputs[0]);ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.015;ramp.color_ramp.elements[0].color=(.008,.022,.012,1);ramp.color_ramp.elements[1].position=.3;ramp.color_ramp.elements[1].color=(.10,.17,.073,1);l.new(bw.outputs[0],ramp.inputs[0]);l.new(ramp.outputs[0],n.get('Principled BSDF').inputs['Base Color'])
rough=pbr_image(n,l,'leather-rough.jpg',co.outputs['Generated'],False);l.new(rough.outputs['Color'],n.get('Principled BSDF').inputs['Roughness']);normal=pbr_image(n,l,'leather-nor_gl.jpg',co.outputs['Generated'],False);nm=n.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.55;l.new(normal.outputs['Color'],nm.inputs['Color']);l.new(nm.outputs[0],n.get('Principled BSDF').inputs['Normal'])
gold=material('Soft aged brass',(.47,.29,.105),.33,.82);texture(gold,95,.08,.0007)
thread=material('Old linen stitches',(.39,.28,.13),.85)
paper=material('Warm laid rag paper',(.64,.52,.32),.8);texture(paper,155,.10,.0009)
ink=material('Faded letterpress ink',(.012,.024,.013),.82)
wood=material('Walnut table, worn grain',(.07,.035,.017),.42)
n=wood.node_tree.nodes;l=wood.node_tree.links;co=n.new('ShaderNodeTexCoord');photo=pbr_image(n,l,'wood-diffuse.jpg',co.outputs['Generated']);l.new(photo.outputs['Color'],n.get('Principled BSDF').inputs['Base Color']);rough=pbr_image(n,l,'wood-rough.jpg',co.outputs['Generated'],False);rgh=n.new('ShaderNodeMath');rgh.operation='ADD';rgh.inputs[1].default_value=.18;l.new(rough.outputs['Color'],rgh.inputs[0]);l.new(rgh.outputs[0],n.get('Principled BSDF').inputs['Roughness']);normal=pbr_image(n,l,'wood-nor_gl.jpg',co.outputs['Generated'],False);nm=n.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.5;l.new(normal.outputs['Color'],nm.inputs['Color']);l.new(nm.outputs[0],n.get('Principled BSDF').inputs['Normal'])
edge=material('Two hundred separate page edges',(.58,.48,.3),.9)
n=edge.node_tree.nodes;l=edge.node_tree.links;co=n.new('ShaderNodeTexCoord');sep=n.new('ShaderNodeSeparateXYZ');l.new(co.outputs['Generated'],sep.inputs[0]);mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=650;l.new(sep.outputs['Z'],mul.inputs[0]);sin=n.new('ShaderNodeMath');sin.operation='SINE';l.new(mul.outputs[0],sin.inputs[0]);ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.24,.17,.08,1);ramp.color_ramp.elements[1].color=(.75,.63,.4,1);l.new(sin.outputs[0],ramp.inputs[0]);l.new(ramp.outputs[0],n.get('Principled BSDF').inputs['Base Color'])
leafmat=material('Living leaf, wax and fine veins',(.075,.18,.047),.4);b=leafmat.node_tree.nodes.get('Principled BSDF');b.inputs['Subsurface Weight'].default_value=0;texture(leafmat,65,.06,.0005)
stemmat=material('Green stems',(.055,.095,.022),.6);veinmat=material('Raised leaf midrib',(.21,.29,.09),.6)
blue=material('Cornflower silk',(.12,.19,.41),.47);blue.node_tree.nodes.get('Principled BSDF').inputs['Subsurface Weight'].default_value=0
white=material('Ivory petals',(.86,.8,.6),.55);white.node_tree.nodes.get('Principled BSDF').inputs['Subsurface Weight'].default_value=0
red=material('Poppy silk',(.47,.028,.018),.47);red.node_tree.nodes.get('Principled BSDF').inputs['Subsurface Weight'].default_value=0
center=material('Flower heart',(.06,.036,.017),.85);pollenmat=material('Golden pollen',(.52,.3,.06),.53)
glow=material('Warm airborne pollen',(.9,.57,.16),.4);glow.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value=(1,.62,.17,1);glow.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=2.2

def empty(name,loc=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None);s.collection.objects.link(o);o.location=loc;o.parent=parent;return o

def relocate(o, collection):
 for c in list(o.users_collection):c.objects.unlink(o)
 collection.objects.link(o)

def mesh(name,vs,fs,mat,parent=None):
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(name,me);s.collection.objects.link(o);o.parent=parent;o.data.materials.append(mat)
 for f in o.data.polygons:f.use_smooth=True
 return o

def cube(name,loc,scale,mat,bevel=.025,parent=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 if bevel:mod=o.modifiers.new('Soft worn edges','BEVEL');mod.width=bevel;mod.segments=3;mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 o.parent=parent;return o

def line(name,pts,radius,mat,parent=None,collection=None):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=12;c.bevel_depth=radius;c.bevel_resolution=2
 sp=c.splines.new('BEZIER');sp.bezier_points.add(len(pts)-1)
 for p,v in zip(sp.bezier_points,pts):p.co=v;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);(collection or s.collection).objects.link(o);o.parent=parent;o.data.materials.append(mat);return o

def sphere(name,loc,scale,mat,parent=None,segments=12):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=8,radius=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.parent=parent;o.data.materials.append(mat)
 for f in o.data.polygons:f.use_smooth=True
 return o

font=bpy.data.fonts.load(str(R/'node_modules/@expo-google-fonts/almendra/400Regular/Almendra_400Regular.ttf'))
italic=bpy.data.fonts.load(str(R/'node_modules/@expo-google-fonts/alegreya/500Medium_Italic/Alegreya_500Medium_Italic.ttf'))
def text(name,words,loc,size,mat,parent=None,f=font):
 c=bpy.data.curves.new(name,'FONT');c.body=words;c.font=f;c.size=size;c.align_x='CENTER';c.extrude=.001;c.bevel_depth=.0005;c.space_character=1.12;o=bpy.data.objects.new(name,c);s.collection.objects.link(o);o.location=loc;o.parent=parent;o.data.materials.append(mat);return o

# Table, framed glasshouse and quiet botanical objects in depth of field.
cube('Walnut writing desk',(0,.5,-.17),(13,11,.28),wood,.065)
for x in [-4,-2,0,2,4]:line('Table board joint',[(x,-5,-.023),(x+.012,0,-.023),(x,5,-.023)],.006,ink)
background=material('Dark greenhouse timber',(.025,.055,.036),.7)
cube('Shadowed glasshouse beyond the window',(0,4.7,3),(12,.08,8),material('Deep garden shade',(.012,.024,.016),.9),.01)
for x in [-4,-2,0,2,4]:cube('Window mullion',(x,4.3,3.2),(.07,.12,7),background,.015)
for z in [1.2,3.2,5.2]:cube('Window transom',(0,4.3,z),(10,.12,.065),background,.015)
# The background has no screen-facing photographic plane; branches cast real light and shadows.
for i in range(16):
 x=random.uniform(-4.8,4.8);z=random.uniform(.8,5.4)
 line('Distant greenhouse branch',[(x,4,z-1),(x+.25,4,z),(x-.1,4,z+.6)],.018,stemmat)
 for j in range(4):sphere('Out-of-focus background leaf',(x+random.uniform(-.4,.4),4+random.uniform(-.2,.2),z+random.uniform(-.5,.4)),(.14,.035,.33),leafmat)
# Old volumes and loose notes near the main book, softer than the hero.
for i in range(3):
 o=cube('Stack of field journals',(-2.3,1.05,.1+i*.18),(1.0,1.5,.17),leather,.04);o.rotation_euler.z=.15+i*.06
for i in range(2):
 o=cube('Loose botanical paper',(1.2,1.3,.015+i*.003),(.7,1.1,.006),paper,.008);o.rotation_euler.z=-.35+i*.15
# Cast shadows from a fern in the warm key light.
for i in range(9):
 x=-3.5+i*.12;y=2.4+i*.08
 line('Side fern stalk',[(x,y,0),(x-.35,y,.6),(x-.2,y,1.2)],.011,stemmat)

book=empty('THE LIVING HERBARIUM');book.rotation_euler.z=-.12
cube('Lower leather board',(0,0,.055),(1.68,2.32,.1),leather,.035,book)
cube('Deckled paper block',(0,0,.276),(1.51,2.15,.34),edge,.018,book)
for j in range(34):cube('Uneven groups of deckled folios',(random.uniform(-.006,.006),random.uniform(-.007,.007),.111+j*.01),(1.52+random.random()*.022,2.16+random.random()*.025,.007),edge,.003,book)
cube('Rounded book spine',(-.81,0,.28),(.13,2.28,.42),leather,.045,book)
for y in [-.85,-.42,0,.42,.85]:cube('Raised binding band',(-.85,y,.29),(.06,.065,.42),gold,.012,book)
cover=empty('Opening front board',(-.8,0,.484),book)
cube('Embossed calfskin cover',(.8,0,0),(1.68,2.32,.085),leather,.035,cover)
cube('Marbled inner endpaper',(.8,0,-.046),(1.52,2.15,.007),paper,.018,cover)
# Double blind-embossed rules, raised gold corners, hand stitching.
for inset in [.1,.145]:
 pts=[(inset,-1.12+inset,.049),(1.6-inset,-1.12+inset,.049),(1.6-inset,1.12-inset,.049),(inset,1.12-inset,.049),(inset,-1.12+inset,.049)]
 o=line('Gold tooled border',pts,.0038,gold,cover)
 for point in o.data.splines[0].bezier_points:point.handle_left_type='VECTOR';point.handle_right_type='VECTOR'
for x in [.05,1.55]:
 for j in range(44):
  y=-1.03+j*.048;line('Linen saddle stitch',[(x,y,.049),(x,y+.018,.049)],.0018,thread,cover)
for y in [-1.05,1.05]:
 for j in range(28):
  x=.1+j*.051;line('Linen saddle stitch',[(x,y,.049),(x+.019,y,.049)],.0018,thread,cover)
for x,y in [(.17,-.94),(1.43,-.94),(.17,.94),(1.43,.94)]:
 sign=1 if x<.8 else -1;sy=-1 if y>0 else 1
 line('Chased brass corner',[(x+sign*.14,y,.055),(x,y,.055),(x,y+sy*.15,.055)],.009,gold,cover)
 for k in range(3):
  theta=k*math.pi/3;line('Corner acanthus scroll',[(x,y,.058),(x+sign*.06,y+sy*.05,.058),(x+sign*.12*math.cos(theta),y+sy*.13,.058)],.003,gold,cover)
text('Gold cover title','Herbier',(.8,.16,.052),.24,gold,cover)
text('Gold cover subtitle','DES COULEURS',(.8,-.08,.052),.082,gold,cover)
text('Imprint','Flora mirabilis',(.8,-.72,.052),.064,gold,cover,italic)
# Botanical gold crest is physical tooling, not a flat decal.
for side in [-1,1]:
 line('Cover botanical branch',[(.8,-.58,.053),(.8+side*.33,-.35,.053),(.8+side*.3,.04,.053),(.8+side*.18,.4,.053)],.0048,gold,cover)
 for j in range(4):
  x=.8+side*(.17+.04*math.sin(j));y=-.4+j*.18
  line('Gold leaf tooling',[(x,y,.055),(x+side*.1,y+.1,.055),(x+side*.14,y+.04,.055),(x,y,.055)],.0038,gold,cover)
for i in range(5):
 q=i*2*math.pi/5;pts=[]
 for j in range(24):
  u=j/23*2*math.pi;xx=.04*math.sin(u);yy=.1*(1-math.cos(u));pts.append((.8+xx*math.cos(q)-yy*math.sin(q),.49+xx*math.sin(q)+yy*math.cos(q),.054))
 line('Embossed five-petal rosette',pts,.0038,gold,cover)
# A brass clasp swings free before the cover opens.
clasp=empty('Unlatching clasp',(1.6,.03,.02),cover)
cube('Clasp tongue',(.04,0,.004),(.21,.14,.02),gold,.015,clasp)
sphere('Clasp stud',(.13,0,.018),(.032,.034,.012),gold,clasp)
for f,angle in [(1,0),(35,0),(61,-1.9),(356,-1.9)]:clasp.rotation_euler.y=angle;clasp.keyframe_insert('rotation_euler',frame=f)
for f,angle in [(1,0),(55,0),(82,-.45),(132,-2.6),(356,-2.75)]:cover.rotation_euler.y=angle;cover.keyframe_insert('rotation_euler',frame=f)

# Real paper surfaces with a soft camber and printed existing botanical watercolors.
def printed(name,index):
 m=material(name,(.76,.66,.44),.84);texture(m,180,.10,.0009);n=m.node_tree.nodes;l=m.node_tree.links;t=n.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(R/f'assets/botanical/plant-{index:02d}-4.png'));mix=n.new('ShaderNodeMixRGB');mix.inputs[1].default_value=(.76,.66,.44,1);l.new(t.outputs['Color'],mix.inputs[2]);l.new(t.outputs['Alpha'],mix.inputs[0]);l.new(mix.outputs[0],n.get('Principled BSDF').inputs['Base Color']);return m
plates=[printed('Printed lily of the valley',6),printed('Printed woodland strawberry',7),printed('Printed poppy',0)]
def page_mesh(name,mat,w=1.5,h=2.12):
 nx,ny=22,8;vs=[];fs=[]
 for j in range(ny+1):
  for i in range(nx+1):
   u=i/nx;v=j/ny;vs.append((u*w,(v-.5)*h,.027*math.sin(u*math.pi)))
 for j in range(ny):
  for i in range(nx):k=j*(nx+1)+i;fs.append((k,k+1,k+nx+2,k+nx+1))
 o=mesh(name,vs,fs,mat,book);uv=o.data.uv_layers.new(name='Printed page UV')
 for poly in o.data.polygons:
  for k in poly.loop_indices:
   vi=o.data.loops[k].vertex_index;uv.data[k].uv=(vs[vi][0]/w,vs[vi][1]/h+.5)
 o.shape_key_add(name='Laid paper');curl=o.shape_key_add(name='Supple curl')
 for v in curl.data:
  u=v.co.x/w;v.co.z+=.25*math.sin(u*math.pi)+.08*u*u*math.sin(v.co.y*3)
 mod=o.modifiers.new('Paper thickness','SOLIDIFY');mod.thickness=.002
 return o,curl
page,curl=page_mesh('Restored watercolor on right page',plates[0]);page.location=(-.75,0,.454);curl.value=.08
for i in range(14):
 page,curl=page_mesh(f'Turning rag paper leaf {i+1}',plates[i%3]);page.location=(-.75,0,.464+i*.002)
 st=65+i*3;en=st+42
 for f,ang,bend in [(1,0,0),(st,0,0),(st+17,-1.2,1),(en,-2.7,.25),(356,-2.7,.25)]:
  page.rotation_euler.y=ang;page.keyframe_insert('rotation_euler',frame=f);curl.value=bend;curl.keyframe_insert('value',frame=f)
# Loose pages lift away in a natural arcing spiral, with real motion blur.
for i in range(9):
 page,curl=page_mesh(f'Airborne botanical sheet {i+1}',plates[(i+1)%3],.52,.76);page.parent=None
 start=107+i*5;end=start+118
 for f in [1,start-1,start,end,356]:
  page.hide_render=not(start<=f<end);page.keyframe_insert('hide_render',frame=f)
 for f in range(start,end+1,6):
  t=(f-start)/(end-start);theta=i*.61+t*5
  page.location=(-.4+math.cos(theta)*(.4+t*2.3),math.sin(theta)*(.25+t*.8),.54+2.8*t)
  page.rotation_euler=(.25*math.sin(theta*2),.5*math.sin(theta)+t*.9,theta*.7);page.keyframe_insert('location',frame=f);page.keyframe_insert('rotation_euler',frame=f);curl.value=.45+.45*math.sin(theta*2);curl.keyframe_insert('value',frame=f)

# A reusable sculpted leaf, including its midrib and secondary veins.
leaf_collection=bpy.data.collections.new('Sculpted leaf and fine veins')
vs=[];fs=[];n=18
for j in range(n+1):
 t=j/n;w=.22*math.sin(math.pi*t)**.8
 for side in [-1,0,1]:vs.append((side*w,t,.09*math.sin(t*math.pi)+.04*abs(side)*math.sin(t*math.pi)))
for j in range(n):
 for k in [0,1]:q=j*3+k;fs.append((q,q+1,q+4,q+3))
leaf=mesh('Leaf lamina',vs,fs,leafmat);s.collection.objects.unlink(leaf);leaf_collection.objects.link(leaf)
line('Leaf midrib',[(0,0,.001),(0,.4,.086),(0,.75,.066),(0,1,0)],.008,veinmat,collection=leaf_collection)
for side in [-1,1]:
 for t in [.23,.4,.57,.72]:line('Secondary vein',[(0,t,.09*math.sin(t*math.pi)+.006),(side*.14,t+.1,.11*math.sin((t+.1)*math.pi)),(side*.18*math.sin(t*math.pi),t+.19,.11*math.sin((t+.19)*math.pi))],.0028,veinmat,collection=leaf_collection)

def instance(name,collection,loc,parent=None):
 o=bpy.data.objects.new(name,None);s.collection.objects.link(o);o.instance_type='COLLECTION';o.instance_collection=collection;o.location=loc;o.parent=parent;return o

def grow(o,start,end,scale):
 for f,m in [(1,.001),(start,.001),(end,1),(356,1)]:o.scale=tuple(v*m for v in scale);o.keyframe_insert('scale',frame=f)
for old in list(bpy.data.objects):
 if old.name.startswith('Out-of-focus background leaf'):bpy.data.objects.remove(old,do_unlink=True)
for i in range(48):
 leaf=instance('Distant sculpted foliage',leaf_collection,(random.uniform(-4.3,4.3),4+random.uniform(-.2,.2),random.uniform(1,5.4)))
 leaf.rotation_euler=(random.uniform(.6,2.4),random.uniform(-.7,.7),random.uniform(-2.8,2.8));leaf.scale=(.6,.6,.6)
# Original cornflower/daisy/poppy petals, with a little translucent tissue.
def make_flower(name,mat,number,wide=False):
 collection=bpy.data.collections.new(name)
 for i in range(number):
  ang=i*math.tau/number;verts=[];faces=[]
  for j in range(11):
   t=j/10;rad=.035+.3*t;width=(.15 if wide else .055)*math.sin(t*math.pi*.9)
   for k in range(7):
    u=k/6*2-1;xx=u*width;yy=rad;z=.07*math.sin(t*math.pi)-.04*t*t+.018*math.sin(u*7+t*9+i)
    verts.append((xx*math.cos(ang)-yy*math.sin(ang),xx*math.sin(ang)+yy*math.cos(ang),z))
  for j in range(10):
   for k in range(6):q=j*7+k;faces.append((q,q+1,q+8,q+7))
  o=mesh(name+' petal',verts,faces,mat);relocate(o,collection)
 o=sphere(name+' heart',(0,0,.03),(.073,.073,.054),center if wide else pollenmat);relocate(o,collection)
 for j in range(26):
  q=j*2.399;r=.066*math.sqrt((j+1)/26);o=sphere('Pollen stamen',(r*math.cos(q),r*math.sin(q),.066+random.random()*.018),(.009,.009,.009),pollenmat if wide else gold,segments=8);relocate(o,collection)
 return collection
flowers=[make_flower('Cornflower',blue,20),make_flower('Daisy',white,17),make_flower('Poppy',red,5,True)]
for i in range(7):
 start=164+i*4;loc=(random.uniform(-.45,.45),random.uniform(-.7,.7),.48);points=[]
 height=random.uniform(1.1,2.0)
 for j in range(13):
  t=j/12;points.append((loc[0]+.27*math.sin(t*3+i)*t,loc[1]+.15*math.sin(t*5+i)*t,loc[2]+height*t))
 stem=line('Growing living botanical stem',points,.011,stemmat,book)
 for f,v in [(1,0),(start,0),(start+58,1),(356,1)]:stem.data.bevel_factor_end=v;stem.data.keyframe_insert('bevel_factor_end',frame=f)
 for j in range(2,11,2):
  leaf=instance('Unfurling veined leaf',leaf_collection,points[j],book);leaf.rotation_euler=(random.uniform(.3,1.0),random.uniform(-.7,.7),i*1.2+j*.7);size=random.uniform(.22,.38);grow(leaf,start+j*3,start+j*3+26,(size,size,size))
 bloom=instance('Blossom opening in the light',flowers[i%3],points[-1],book);bloom.rotation_euler=(random.uniform(.1,.4),random.uniform(-.4,.4),i*.8);grow(bloom,start+34,start+76,(.64,.64,.64))
# Small motes are actual emissive geometry and catch photographic depth of field.
for i in range(70):
 mote=sphere('Drifting golden pollen',(0,0,0),(.006,.006,.006),glow,segments=8)
 origin=Vector((random.uniform(-1.5,1.4),random.uniform(-.6,1.3),random.uniform(.5,2.8)))
 for f in [1,110,210,356]:
  t=(f-1)/355;mote.location=origin+Vector((.2*math.sin(i+t*4),.13*math.cos(i+t*3),.3*t));mote.keyframe_insert('location',frame=f)
 for f,m in [(1,.05),(85,.05),(180,1),(312,.6),(356,.1)]:mote.scale=(.006*m,)*3;mote.keyframe_insert('scale',frame=f)

# Warm, large-source photographic light. No expensive noisy volumetric box.
def light(name,loc,power,color,size,target=(0,0,.4)):
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color;o=bpy.data.objects.new(name,data);s.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
light('Sun through glasshouse',(-3,2.0,5.0),500,(1,.78,.48),3.5)
light('Soft sky fill',(2,-2,4.2),180,(.7,.82,.88),4)
light('Quiet brass rim',(1.5,3.0,2.7),230,(1,.7,.38),2)
focus=empty('Cinematic focus',(0,0,.45));data=bpy.data.cameras.new('Portrait film camera');cam=bpy.data.objects.new('Portrait film camera',data);s.collection.objects.link(cam);s.camera=cam;data.sensor_fit='VERTICAL';data.sensor_height=36;data.lens=48;data.dof.use_dof=True;data.dof.focus_object=focus;data.dof.aperture_fstop=3.2
poses=[(1,(2.0,-3.5,3.4),(0,0,.42),48),(65,(1.7,-3.9,3.6),(-.1,0,.42),48),(146,(2.0,-5.0,4.0),(-.65,0,.65),45),(250,(1.6,-4.7,4.1),(-.35,0,1.0),47),(316,(.5,-2.5,4.4),(-.05,.1,.8),51),(356,(.05,-.3,2.2),(0,.05,.46),55)]
for f,loc,target,lens in poses:
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.keyframe_insert('location',frame=f);cam.keyframe_insert('rotation_euler',frame=f);focus.location=target;focus.keyframe_insert('location',frame=f);data.lens=lens;data.keyframe_insert('lens',frame=f)
# Keep camera and sheet paths smooth, but visibility cuts stay discrete.
for obj in bpy.data.objects:
 if obj.animation_data and obj.animation_data.action:
  for curve in obj.animation_data.action.fcurves:
   if curve.data_path not in ['hide_render']:
    for k in curve.keyframe_points:k.interpolation='BEZIER'
# Auxiliary reflectance/normals protect the photographed grain during denoising.
s.view_layers[0].cycles.denoising_store_passes=True
s.use_nodes=True;tree=s.node_tree;layer=tree.nodes.get('Render Layers')
output=tree.nodes.new('CompositorNodeOutputFile');output.base_path=str(out/'aux');output.format.file_format='OPEN_EXR';output.format.color_depth='16';output.format.color_mode='RGB';output.file_slots.clear()
for pass_name,filename in [('Denoising Albedo','albedo_'),('Denoising Normal','normal_')]:
 slot=output.file_slots.new(filename);tree.links.new(layer.outputs[pass_name],output.inputs[filename])
# Pack original project images/fonts for a reviewable model; do not ship Blender in the app.
bpy.ops.file.pack_all();s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(out/'herbier-opening.blend'))
frames=[int(f) for f in a.preview.split(',')] if a.preview else list(range(a.start,a.end+1))
for f in frames:
 path=out/f'frame-{f:04d}.exr'
 if path.exists() and not a.preview:continue
 s.frame_set(f);s.render.filepath=str(path);t=time.time();bpy.ops.render.render(write_still=True);print(f'HERBIER_FRAME {f} seconds={time.time()-t:.2f}',flush=True)
 if a.preview:
  s.render.image_settings.file_format='PNG';s.render.image_settings.color_depth='8';bpy.data.images['Render Result'].save_render(str(out/f'preview-{f:04d}.png'),scene=s);s.render.image_settings.file_format='OPEN_EXR';s.render.image_settings.color_depth='16'
print('HERBIER_RENDER_DONE',flush=True)
