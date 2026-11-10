"""Pack the first two new watercolor washes without changing a decoded pixel.

The 200-plant campaign otherwise exceeds EAS Update's 1,000-asset limit.
Only two frames share a bitmap, keeping mobile decode memory modest.
Run after generating the botanical rasters; the original twenty stay untouched.
"""
from pathlib import Path
from PIL import Image
import re

root = Path(__file__).resolve().parent.parent
folder = root / 'assets/botanical'
before = after = 0
for index in range(20, 200):
    prefix = f'plant-{index:02}'
    sources = [folder / f'{prefix}-{s}.webp' for s in range(2)]
    target = folder / f'{prefix}-early.webp'
    if not all(p.exists() for p in sources):
        assert target.exists(), target
        continue
    parts = [Image.open(p).convert('RGBA') for p in sources]
    assert parts[0].size == parts[1].size == (360, 490)
    strip = Image.new('RGBA', (720, 490))
    for frame, part in enumerate(parts):
        strip.paste(part, (frame * 360, 0))
    strip.save(target, 'WEBP', lossless=True, method=4, exact=True)
    decoded = Image.open(target).convert('RGBA')
    for frame, part in enumerate(parts):
        assert decoded.crop((frame * 360, 0, (frame + 1) * 360, 490)).tobytes() == part.tobytes()
    before += sum(p.stat().st_size for p in sources)
    after += target.stat().st_size
    for p in sources:
        p.unlink()
    if index % 20 == 0:
        print(f'Packed through plate {index + 1}', flush=True)
manifest = root / 'src/data/botanicalRasters.ts'
text = manifest.read_text()
text = re.sub(r'(plant-(\d+))-[01]\.webp', lambda m: m[1] + '-early.webp' if int(m[2]) >= 20 else m[0], text)
manifest.write_text(text)
print(f'Packed 180 pairs: {before / 1048576:.1f} -> {after / 1048576:.1f} MiB; all decoded pixels verified.', flush=True)
