import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

def shape_text(text):
    return get_display(arabic_reshaper.reshape(text))

def wrap_and_shape(text, max_chars=25):
    words = text.split(' ')
    lines = []
    cur = ''
    for w in words:
        cand = cur + (' ' if cur else '') + w
        if len(cand) <= max_chars:
            cur = cand
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return [shape_text(line) for line in lines]

w, h = 300, 450

pts = [
    (14, 28), (38, 10), (w // 2, 7), (w - 38, 10), (w - 14, 28),
    (w - 10, 45), (w - 8, h - 35), (w - 25, h - 10),
    (w // 2, h - 7), (25, h - 10), (8, h - 35), (10, 45)
]
base_mask = Image.new('L', (w, h), 0)
b_draw = ImageDraw.Draw(base_mask)
b_draw.polygon(pts, fill=255)

art_pts = [
    (32, 54), (w - 32, 54),
    (w - 18, 72), (w - 18, 222),
    (w - 32, 238), (32, 238),
    (18, 222), (18, 72)
]
art_mask = Image.new('L', (w, h), 0)
a_draw = ImageDraw.Draw(art_mask)
a_draw.polygon(art_pts, fill=255)

desc_pts = [
    (30, 256), (w - 30, 256),
    (w - 18, 270), (w - 18, h - 28),
    (w - 30, h - 16), (30, h - 16),
    (18, h - 28), (18, 270)
]
desc_mask = Image.new('L', (w, h), 0)
d_draw = ImageDraw.Draw(desc_mask)
d_draw.polygon(desc_pts, fill=255)

ribbon_pts = [
    (28, 15), (w - 28, 15),
    (w - 16, 28), (w - 28, 41),
    (28, 41), (16, 28)
]
r_mask = Image.new('L', (w, h), 0)
r_draw = ImageDraw.Draw(r_mask)
r_draw.polygon(ribbon_pts, fill=255)

font_title = ImageFont.truetype(r'C:\Windows\Fonts\tahomabd.ttf', 17)
font_val = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 23)
font_type = ImageFont.truetype(r'C:\Windows\Fonts\tahomabd.ttf', 11)
font_desc = ImageFont.truetype(r'C:\Windows\Fonts\tahoma.ttf', 13)
font_big_num = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 68)

gold_bright = (235, 195, 65, 255)
gold = (205, 160, 45, 255)
gold_dark = (110, 85, 20, 255)

palettes = {
    'attack':  ((175, 20, 32), (38, 8, 12), (210, 35, 45)),
    'defense': ((20, 85, 160), (8, 22, 50), (35, 120, 215)),
    'utility': ((20, 135, 75), (8, 42, 22), (35, 180, 95)),
    'bluff':   ((120, 30, 150), (32, 8, 48), (155, 45, 195)),
    'wild':    ((205, 145, 20), (52, 36, 8), (240, 175, 35)),
    'number':  ((145, 25, 32), (42, 9, 13), (185, 38, 48))
}

def create_card(card_key, title_ar, category_ar, value_str, desc_ar, icon_source=None, is_num=False, palette_key='number', out_path=None):
    card = Image.new('RGBA', (w, h), (0, 0, 0, 0))

    metal_arr = np.zeros((h, w, 4), dtype=np.uint8)
    for y in range(h):
        t = y / float(h)
        shade = int(24 + 10 * (1.0 - t))
        metal_arr[y, :, 0] = shade
        metal_arr[y, :, 1] = shade + 1
        metal_arr[y, :, 2] = shade + 6
        metal_arr[y, :, 3] = 255
    metal_img = Image.fromarray(metal_arr)
    card.paste(metal_img, (0, 0), base_mask)

    draw = ImageDraw.Draw(card)

    for i in range(len(pts)):
        p1, p2 = pts[i], pts[(i + 1) % len(pts)]
        draw.line([p1, p2], fill=gold_dark, width=5)
        draw.line([p1, p2], fill=gold, width=2)

    for pt in [(16, 30), (w - 16, 30), (16, h - 30), (w - 16, h - 30)]:
        draw.ellipse([pt[0] - 4, pt[1] - 4, pt[0] + 4, pt[1] + 4], fill=gold_bright, outline=gold_dark, width=1)

    c_center, c_edge, c_glow = palettes.get(palette_key, palettes['number'])
    art_w = w - 36
    art_h = 184
    Y, X = np.ogrid[:art_h, :art_w]
    cx_a, cy_a = art_w / 2.0, art_h / 2.0
    dist = np.sqrt(((X - cx_a) / art_w) ** 2 + ((Y - cy_a) / art_h) ** 2)
    r = np.clip(c_center[0] - (c_center[0] - c_edge[0]) * dist * 1.6, c_edge[0], c_center[0]).astype(np.uint8)
    g = np.clip(c_center[1] - (c_center[1] - c_edge[1]) * dist * 1.6, c_edge[1], c_center[1]).astype(np.uint8)
    b = np.clip(c_center[2] - (c_center[2] - c_edge[2]) * dist * 1.6, c_edge[2], c_center[2]).astype(np.uint8)
    art_arr = np.dstack([r, g, b, np.full_like(r, 255)])
    art_img = Image.fromarray(art_arr)
    card.paste(art_img, (18, 54), art_mask.crop((18, 54, w - 18, 238)))

    for i in range(len(art_pts)):
        p1, p2 = art_pts[i], art_pts[(i + 1) % len(art_pts)]
        draw.line([p1, p2], fill=gold_dark, width=3)
        draw.line([p1, p2], fill=gold, width=1)

    if is_num:
        bb = draw.textbbox((0, 0), value_str, font=font_big_num)
        nw, nh = bb[2] - bb[0], bb[3] - bb[1]
        nx = (w - nw) // 2
        ny = 68 + (150 - nh) // 2
        draw.text((nx + 3, ny + 3), value_str, fill=(10, 10, 10, 240), font=font_big_num)
        draw.text((nx - 1, ny - 1), value_str, fill=c_glow, font=font_big_num)
        draw.text((nx, ny), value_str, fill=(255, 248, 220, 255), font=font_big_num)
    elif icon_source and os.path.exists(icon_source):
        try:
            icon_raw = Image.open(icon_source).convert('RGBA')
            bbox = icon_raw.getbbox()
            if bbox:
                icon_raw = icon_raw.crop(bbox)
            icon_raw.thumbnail((180, 135), Image.Resampling.LANCZOS)
            ix = (w - icon_raw.width) // 2
            iy = 64 + (155 - icon_raw.height) // 2
            card.paste(icon_raw, (ix, iy), icon_raw)
        except Exception as e:
            print(f'Error loading icon for {card_key}: {e}')

    desc_plate = Image.new('RGBA', (w, h), (14, 15, 20, 255))
    card.paste(desc_plate, (0, 0), desc_mask)
    for i in range(len(desc_pts)):
        p1, p2 = desc_pts[i], desc_pts[(i + 1) % len(desc_pts)]
        draw.line([p1, p2], fill=gold_dark, width=3)
        draw.line([p1, p2], fill=gold, width=1)

    ribbon_bg = Image.new('RGBA', (w, h), (232, 235, 242, 255))
    card.paste(ribbon_bg, (0, 0), r_mask)
    for i in range(len(ribbon_pts)):
        p1, p2 = ribbon_pts[i], ribbon_pts[(i + 1) % len(ribbon_pts)]
        draw.line([p1, p2], fill=gold_dark, width=2)
        draw.line([p1, p2], fill=gold, width=1)

    title_display = shape_text(title_ar)
    tb = draw.textbbox((0, 0), title_display, font=font_title)
    tw, th_ = tb[2] - tb[0], tb[3] - tb[1]
    draw.text(((w - tw) // 2, 27 - th_ // 2), title_display, fill=(18, 20, 26, 255), font=font_title)

    draw.rounded_rectangle([w // 2 - 56, 39, w // 2 + 56, 55], radius=4, fill=c_glow, outline=gold, width=1)
    cat_display = shape_text(category_ar)
    sb = draw.textbbox((0, 0), cat_display, font=font_type)
    sw, sh = sb[2] - sb[0], sb[3] - sb[1]
    draw.text(((w - sw) // 2, 47 - sh // 2), cat_display, fill=(255, 255, 255, 255), font=font_type)

    med_y = 246
    draw.arc([w // 2 - 82, med_y - 24, w // 2 - 16, med_y + 24], start=45, end=270, fill=gold, width=3)
    draw.arc([w // 2 + 16, med_y - 24, w // 2 + 82, med_y + 24], start=-90, end=135, fill=gold, width=3)
    draw.line([(w // 2 - 82, med_y), (w // 2 - 25, med_y)], fill=gold_bright, width=2)
    draw.line([(w // 2 + 25, med_y), (w // 2 + 82, med_y)], fill=gold_bright, width=2)

    draw.ellipse([w // 2 - 26, med_y - 26, w // 2 + 26, med_y + 26], fill=(22, 24, 30, 255), outline=gold, width=3)
    draw.ellipse([w // 2 - 21, med_y - 21, w // 2 + 21, med_y + 21], fill=(12, 14, 18, 255), outline=gold_dark, width=2)

    draw.ellipse([30, med_y - 12, 54, med_y + 12], fill=(18, 20, 25, 255), outline=gold, width=2)
    draw.ellipse([w - 54, med_y - 12, w - 30, med_y + 12], fill=(18, 20, 25, 255), outline=gold, width=2)
    draw.ellipse([38, med_y - 4, 46, med_y + 4], fill=c_glow)
    draw.ellipse([w - 46, med_y - 4, w - 38, med_y + 4], fill=c_glow)

    vb = draw.textbbox((0, 0), value_str, font=font_val)
    vw, vh = vb[2] - vb[0], vb[3] - vb[1]
    draw.text(((w - vw) // 2, med_y - vh // 2 - 2), value_str, fill=(255, 230, 110, 255), font=font_val)

    lines = wrap_and_shape(desc_ar, max_chars=26)
    line_h = 22
    total_text_h = len(lines) * line_h
    start_y = 280 + max(0, (135 - total_text_h) // 2)
    for idx, ln in enumerate(lines):
        lb = draw.textbbox((0, 0), ln, font=font_desc)
        lw = lb[2] - lb[0]
        draw.text(((w - lw) // 2, start_y + idx * line_h), ln, fill=(230, 232, 240, 255), font=font_desc)

    if out_path:
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        card.save(out_path)
        print(f'Successfully created: {out_path}')

test_dir = r'C:\Users\i-seven\.gemini\antigravity\brain\48ef237f-10e7-4a01-b615-dd0978c8e803\scratch'
create_card('magnatees', 'مغناطيس', 'أكشن هجومي', 'A', 
            'اطلب أي رقم في إيدك، يجيلك فوراً من كل اللاعبين في نفس اللحظة!',
            icon_source=r'z:\CA TCH\public\cards\magnatees.png',
            is_num=False, palette_key='attack',
            out_path=os.path.join(test_dir, 'test_magnatees.png'))

create_card('number_7', 'رقم 7', 'كارت رقم', '7',
            'اجمع 4 كروت من نفس الرقم (أو 3 + جوكر) لتكوين سيت كامل.',
            icon_source=None,
            is_num=True, palette_key='number',
            out_path=os.path.join(test_dir, 'test_number_7.png'))
