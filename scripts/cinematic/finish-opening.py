"""Denoise the linear frames with Intel Open Image Denoise, then encode a local H.264 film.
python3 scripts/cinematic/finish-opening.py --frames /tmp/herbier-cinematic-final --oidn /tmp/oidn-2.5.1.x86_64.linux/bin/oidnDenoise
This waits for the renderer; it never publishes an incomplete film.
"""
import argparse,subprocess,time,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--frames',type=Path,required=True);p.add_argument('--oidn',required=True);p.add_argument('--start',type=int,default=1);p.add_argument('--end',type=int,default=356);a=p.parse_args()
root=Path(__file__).resolve().parents[2];clean=a.frames/'clean';png=a.frames/'png';clean.mkdir(exist_ok=True);png.mkdir(exist_ok=True)
def run(args):subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
for frame in range(a.start,a.end+1):
 src=a.frames/f'frame-{frame:04d}.exr';dst=clean/f'frame-{frame:04d}.exr'
 if dst.exists():continue
 deadline=time.monotonic()+7200
 while not src.exists() or src.stat().st_size<1000:
  if time.monotonic()>deadline:raise TimeoutError(f'Missing rendered frame {frame}')
  time.sleep(1)
 # Renderer saves EXR in under 0.1s; an extra short wait avoids reading a partial file.
 time.sleep(.18)
 noisy=clean/'noisy.pfm';filtered=clean/'denoised.pfm';temp=clean/'denoised.exr'
 run(['ffmpeg','-y','-hide_banner','-loglevel','error','-threads','1','-i',str(src),'-c:v','pfm',str(noisy)])
 auxiliaries=[]
 for name in ['albedo','normal']:
  auxsrc=a.frames/'aux'/f'{name}_{frame:04d}.exr';auxdst=clean/f'{name}.pfm'
  run(['ffmpeg','-y','-hide_banner','-loglevel','error','-threads','1','-i',str(auxsrc),'-c:v','pfm',str(auxdst)])
  auxiliaries.append(str(auxdst))
 run([a.oidn,'--hdr',str(noisy),'--alb',auxiliaries[0],'--nrm',auxiliaries[1],'-o',str(filtered),'--threads','2','-v','0'])
 run(['ffmpeg','-y','-hide_banner','-loglevel','error','-threads','1','-i',str(filtered),'-c:v','exr',str(temp)])
 temp.replace(dst)
 print(f'HERBIER_DENOISED {frame}',flush=True)
# Save color-managed display PNGs in one Blender process, preserving the scene's AgX grading.
script=clean/'display-pngs.py'
script.write_text(f'''import bpy\nfrom pathlib import Path\ns=bpy.context.scene;s.render.image_settings.file_format='PNG';s.render.image_settings.color_depth='8';s.render.image_settings.color_mode='RGB'\nfor f in range(1,357):\n im=bpy.data.images.load(str(Path({str(clean)!r})/f'frame-{{f:04d}}.exr'));im.save_render(str(Path({str(png)!r})/f'frame-{{f:04d}}.png'),scene=s);bpy.data.images.remove(im)\n print('HERBIER_DISPLAY',f,flush=True)\n''')
subprocess.run(['blender','-b',str(a.frames/'herbier-opening.blend'),'--threads','5','--python',str(script)],check=True)
assets=root/'assets/cinematic';assets.mkdir(exist_ok=True)
movie=assets/'herbier-opening.mp4';poster=assets/'opening-poster.jpg';encoded=assets/'herbier-opening-render.mp4'
run(['ffmpeg','-y','-hide_banner','-loglevel','error','-framerate','24','-i',str(png/'frame-%04d.png'),'-vf','hqdn3d=0.6:0.4:1.0:0.8,scale=out_color_matrix=bt709:out_range=tv','-t','14.8','-c:v','libx264','-preset','slow','-crf','18','-profile:v','high','-level:v','3.1','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart','-an',str(encoded)])
encoded.replace(movie)
run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(png/'frame-0001.png'),'-q:v','2',str(poster)])
info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(movie)]))
manifest={'title':'Le livre se souvient','original':True,'renderer':'Blender 4.3.2 Cycles CPU','rendered_frames':356,'encoded_frames':int(info['streams'][0]['nb_frames']),'resolution':[720,1280],'fps':24,'ray_samples':4,'denoiser':'Intel Open Image Denoise 2.5.1 with albedo and normal passes','duration':info['format']['duration'],'bytes':movie.stat().st_size,'sha256':hashlib.sha256(movie.read_bytes()).hexdigest(),'audio':'Silent video; original prologue music remains managed separately','models':'Original procedural geometry, CC0','textures':'Original project botanical plates and paper; Poly Haven CC0 leather/wood maps; bundled SIL fonts','codec':'H.264 High, level 3.1, yuv420p, BT.709, faststart'}
(assets/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('HERBIER_MOVIE_READY',manifest['bytes'],manifest['sha256'],flush=True)
