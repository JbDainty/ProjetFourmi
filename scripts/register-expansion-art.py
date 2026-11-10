"""Register measured specimen bounds from the generated nine-specimen atlases.
This is asset registration; original illustration pixels remain unchanged.
"""
from pathlib import Path
from PIL import Image
import numpy as np,json
manifest=[];audit=[]
def cut(profile,target,radius):
 lo=max(1,int(target-radius));hi=min(len(profile)-1,int(target+radius))
 segment=profile[lo:hi];minimum=segment.min();hits=np.where(segment==minimum)[0]+lo
 return int(hits[np.argmin(abs(hits-target))])
for index in range(20):
 path=Path(f'assets/illustrations/expansion-{index:02d}.webp');im=Image.open(path).convert('RGBA');w,h=im.size
 a=np.array(im)[:,:,3];ink=a>24
 ys=[0,cut(ink.sum(axis=1),h/3,h*.08),cut(ink.sum(axis=1),h*2/3,h*.08),h]
 bounds=[]
 for row in range(3):
  profile=ink[ys[row]:ys[row+1]].sum(axis=0)
  xs=[0,cut(profile,w/3,w*.075),cut(profile,w*2/3,w*.075),w]
  for col in range(3):
   crop=a[ys[row]:ys[row+1],xs[col]:xs[col+1]]
   yy,xx=np.where(crop>3)
   if not len(xx):raise ValueError(f'Empty specimen {index}/{row}/{col}')
   bounds.append([max(xs[col],xs[col]+int(xx.min())-4),max(ys[row],ys[row]+int(yy.min())-4),min(xs[col+1],xs[col]+int(xx.max())+5),min(ys[row+1],ys[row]+int(yy.max())+5)])
 manifest.append("{source:require('../../"+str(path)+"'),width:"+str(w)+",height:"+str(h)+",bounds:"+json.dumps(bounds)+"}")
 audit.append({'atlas':str(path),'size':[w,h],'specimens':bounds})
Path('src/data/expandedIllustrations.ts').write_text('/** Measured bounds; nine distinct specimens per generated atlas. */\nexport const expandedIllustrationAtlases=[\n'+',\n'.join(manifest)+'\n] as const;\n')
Path('docs/expansion/art-bounds.json').write_text(json.dumps(audit,indent=2))
