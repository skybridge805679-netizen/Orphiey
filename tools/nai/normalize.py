#!/usr/bin/env python3
"""스탠딩 규격 맞추기 (cowboy shot · 832x1216 · 투명 배경).
 - 머리 꼭대기를 캔버스 위에서 같은 높이(TOP)로, 머리 가운데를 캔버스 가운데로 맞춘다.
 - cowboy shot은 아래가 캔버스 끝에 닿아야 하므로 아래를 기준으로 확대해 맞춘다(축소는 하지 않음 → 아래에 빈칸이 생기지 않게).
 - 같은 그림에 두 번 돌려도 결과가 같다.
실행: python3 tools/nai/normalize.py [파일...]   (인자가 없으면 assets/nai/chr/*.png)"""
import sys, glob
from PIL import Image

W, H, TOP = 832, 1216, 0.04   # 머리 꼭대기 = 위에서 4%


def bbox_rows(a, thr=24):
    w, h = a.size
    px = a.load()
    top = next((y for y in range(h) if any(px[x, y] > thr for x in range(0, w, 2))), 0)
    bottom = next((y for y in range(h - 1, -1, -1) if any(px[x, y] > thr for x in range(0, w, 2))), h - 1)
    return top, bottom


def head_center(a, top, bottom, thr=24):
    w, _ = a.size
    px = a.load()
    band = max(8, int((bottom - top) * 0.12))   # 머리 부분(위 12%)
    xs = [x for y in range(top, min(top + band, a.size[1])) for x in range(0, w, 2) if px[x, y] > thr]
    return (min(xs) + max(xs)) / 2 if xs else w / 2


def normalize(path):
    im = Image.open(path).convert('RGBA')
    if im.size != (W, H):
        im = im.resize((W, H), Image.LANCZOS)
    a = im.getchannel('A')
    top, bottom = bbox_rows(a)
    want = int(H * TOP)
    s = max(1.0, (H - want) / max(1, H - top))          # 아래 기준 확대
    if s > 1.001:
        im = im.resize((round(W * s), round(H * s)), Image.LANCZOS)
    a = im.getchannel('A')
    t2, b2 = bbox_rows(a)
    cx = head_center(a, t2, b2)
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ox = round(W / 2 - cx)
    oy = H - im.size[1]                                    # 아래를 캔버스 아래에
    if s <= 1.001 and t2 < want:
        oy = want - t2                                     # 머리가 선보다 위면 아래로 내린다(아래쪽이 조금 더 잘린다)
    out.paste(im, (ox, oy), im)                            # 음수 위치도 잘려서 붙는다
    out.save(path)
    return s, ox


if __name__ == '__main__':
    files = sys.argv[1:] or sorted(glob.glob('assets/nai/chr/*.png'))
    for f in files:
        s, ox = normalize(f)
        print(f'{f}: 확대 {s:.3f}, 가로 이동 {ox:+d}px')
