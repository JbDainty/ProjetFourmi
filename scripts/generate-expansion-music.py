"""Fifteen original quiet acoustic scores. CC0 composition; FluidR3 GM instruments MIT.
Uses the existing renderer and pinned SoundFont, never downloads runtime audio.
"""
from pathlib import Path
import json
# Reuse the verified acoustic renderer without re-rendering the existing five biomes.
exec(Path('scripts/generate-cozy-audio.py').read_text().split('# Keep the original meadow score')[0])
manifest=[]
progressions=[([0,-3,5,7,0,5,2,7],[4,3,4,4,4,4,3,4]),([0,5,-2,7,3,5,0,7],[3,3,4,3,4,3,3,4]),([0,7,5,0,-3,2,5,7],[4,4,4,4,3,3,4,4])]
for eco in range(5,20):
    root=[48,50,53,55,47,52,45,50,48,53,55,50,48,52,45][eco-5]
    bpm=[58,60,56,62,54,56,58,52,54,60,52,62,60,56,50][eco-5]
    beat=60/bpm; duration=64*beat
    offsets,thirds=progressions[(eco-5)%3];events=[]
    for cycle in range(2):
        for chord,(offset,third) in enumerate(zip(offsets,thirds)):
            base=root+offset;t=(cycle*64+chord*8)*beat
            for voice,pitch,vel,delay in [(1,base-12,29,.04),(2,base+7,24,.3),(2,base+third+12,22,.55)]:
                note(events,t+delay,7.4*beat,voice,pitch,vel+(chord%3)-1)
            # Alternating harp inversions, gentle bass movement, sparse piano replies.
            contour=[0,7,12+third,19,14,12,7,12+third]
            if eco%2:contour=[0,12+third,7,14,19,7,12,7]
            for j,interval in enumerate(contour):
                if (j+eco+chord)%5==0:continue
                note(events,t+(j+.12)*beat,2.7*beat,0,base+interval,32+(j%3)*2)
            phrase=[[12,14,19,12+third],[19,12+third,14,12],[12+third,19,21,19]][(eco+chord)%3]
            for k,interval in enumerate(phrase):
                at=[.8,2.8,5.0,6.7][k]
                # Piano/soft cello only: no bright reed or brass timbre.
                voice=4 if (eco+chord)%2 else 1
                pitch=base+interval-(12 if voice==1 else 0)
                note(events,t+at*beat,2.0*beat,voice,pitch,27+(k%2)*3)
            note(events,t+4.3*beat,3.0*beat,2,base+14,18)
    song=render(events,2*duration+4)
    loop=song[round(duration*RATE):round(2*duration*RATE)]
    data=finish(loop,.36,edge=.06)
    out=Path(f'assets/music/ecosystem-{eco:02d}.mp3')
    subprocess.run(['ffmpeg','-y','-v','error','-f','s16le','-ar',str(RATE),'-ac','2','-i','pipe:0','-codec:a','libmp3lame','-b:a','112k',str(out)],input=data.tobytes(),check=True)
    manifest.append({'ecosystem':eco,'file':str(out),'seconds':duration,'bpm':bpm,'instruments':['harp','cello','soft strings','piano'],'composition':'CC0-1.0','samples':'FluidR3 GM / MIT','sha256':hashlib.sha256(out.read_bytes()).hexdigest()})
    print('Rendered ecosystem',eco,flush=True)
Path('scripts/expansion-music-manifest.json').write_text(json.dumps(manifest,indent=2))
