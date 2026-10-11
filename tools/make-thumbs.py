# Writes small JPEG thumbnails to assets/thumbs/ for the gallery grid and save slots.
# Run after adding art: python3 tools/make-thumbs.py
import os
from PIL import Image
root=os.path.join(os.path.dirname(__file__),'..','assets')
out=os.path.join(root,'thumbs');os.makedirs(out,exist_ok=True)
n=0
for f in sorted(os.listdir(root)):
    if not f.endswith('.png'):continue
    dst=os.path.join(out,f[:-4]+'.jpg')
    if os.path.exists(dst) and os.path.getmtime(dst)>=os.path.getmtime(os.path.join(root,f)):continue
    im=Image.open(os.path.join(root,f)).convert('RGBA')
    bg=Image.new('RGBA',im.size,(9,23,34,255));bg.alpha_composite(im)
    bg=bg.convert('RGB');bg.thumbnail((360,360));bg.save(dst,quality=82,optimize=True);n+=1
print('thumbs written',n)
