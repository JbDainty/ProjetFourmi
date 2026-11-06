"""Check evaluated, curled paper against the solid animated cover, including subframes.

blender -b /path/to/herbier-opening.blend --python-exit-code 1 --python scripts/cinematic/check-clearance.py
This is an offline geometry check; it adds no collision work to the mobile game.
"""
import bpy
from mathutils.bvhtree import BVHTree

scene = bpy.context.scene
board = bpy.data.objects['Embossed calfskin cover']
papers = [obj for obj in bpy.data.objects if obj.name.startswith((
    'Turning rag paper leaf', 'Airborne botanical sheet', 'Restored watercolor',
))]


def evaluated_tree(obj, depsgraph):
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    try:
        return BVHTree.FromPolygons(
            [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices],
            [list(polygon.vertices) for polygon in mesh.polygons],
        )
    finally:
        evaluated.to_mesh_clear()


collisions = []
for half_frame in range(scene.frame_start * 2, scene.frame_end * 2 + 1):
    scene.frame_set(half_frame // 2, subframe=(half_frame % 2) / 2)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    cover_tree = evaluated_tree(board, depsgraph)
    turning, airborne = [], []
    for paper in papers:
        if paper.hide_render:
            continue
        paper_tree = evaluated_tree(paper, depsgraph)
        if cover_tree.overlap(paper_tree):
            collisions.append((half_frame / 2, 'cover', paper.name))
        if paper.name.startswith('Turning rag paper'):
            turning.append((paper.name, paper_tree))
        if paper.name.startswith('Airborne botanical'):
            airborne.append((paper.name, paper_tree))
    for loose_name, loose_tree in airborne:
        for bound_name, bound_tree in turning:
            if loose_tree.overlap(bound_tree):
                collisions.append((half_frame / 2, loose_name, bound_name))

if collisions:
    raise RuntimeError(f'{len(collisions)} paper intersections: {collisions[:15]}')
print(f'HERBIER_CLEARANCE_OK: {len(papers)} paper surfaces, frames 1–356, half-frame sampling.', flush=True)
