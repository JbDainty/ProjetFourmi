"""Compress generated delivery assets; never alter the original twenty plates.
WebP retains alpha and reduces mobile downloads and decoded-atlas work.
"""
from pathlib import Path
from PIL import Image
import re
files=list(Path('assets/illustrations').glob('expansion-*.png'))+list(Path('assets/journey').glob('ecosystem-*.png'))
files += [p for p in Path('assets/botanical').glob('plant-*.png') if int(p.name.split('-')[1])>=20]
before=after=0
for i,p in enumerate(files):
 before+=p.stat().st_size
 out=p.with_suffix('.webp')
 Image.open(p).save(out,'WEBP',quality=91,method=5,exact=True)
 after+=out.stat().st_size;p.unlink()
 if i%100==0:print('Compressed',i,flush=True)
print(f'Compressed {len(files)} generated assets: {before/1048576:.1f} → {after/1048576:.1f} MiB',flush=True)
p=Path('src/data/expandedIllustrations.ts');p.write_text(p.read_text().replace('.png','.webp'))
p=Path('src/data/journeyLandscapes.ts');p.write_text(re.sub(r'(ecosystem-\d+)\.png',r'\1.webp',p.read_text()))
p=Path('src/data/botanicalRasters.ts');s=p.read_text();s=re.sub(r'(plant-(\d+)-[0-4])\.png',lambda m:m[1]+('.webp' if int(m[2])>=20 else '.png'),s);p.write_text(s)
p=Path('docs/expansion/art-bounds.json');p.write_text(p.read_text().replace('.png','.webp'))
