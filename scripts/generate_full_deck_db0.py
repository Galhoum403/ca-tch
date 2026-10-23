import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import arabic_reshaper
from bidi.algorithm import get_display

def shape_text(text):
    return get_display(arabic_reshaper.reshape(text))

def wrap_and_shape(text, max_chars=26):
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

font_title = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 19)
font_val = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 23)
font_type = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 12)
font_desc = ImageFont.truetype(r'C:\Windows\Fonts\tahoma.ttf', 13)
font_big_num = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 72)

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

OUT_DIR = r'z:\CA TCH\godot_project\cards'
os.makedirs(OUT_DIR, exist_ok=True)
PUBLIC_DIR = r'z:\CA TCH\public\cards'

def extract_emblem(im_path):
    if not os.path.exists(im_path):
        return None
    try:
        im = Image.open(im_path).convert('RGBA')
        arr = np.array(im)
        alpha = arr[:, :, 3]
        is_card = (alpha > 100) & ~((arr[:, :, 0] > 250) & (arr[:, :, 1] > 250) & (arr[:, :, 2] > 250))
        col_counts = np.sum(is_card, axis=0)
        row_counts = np.sum(is_card, axis=1)
        cols = np.where(col_counts > 50)[0]
        rows = np.where(row_counts > 50)[0]
        if len(cols) == 0 or len(rows) == 0:
            return None
        if cols[-1] - cols[0] > 320:
            left_c = np.sum(is_card[:, cols[0]:cols[0]+280])
            right_c = np.sum(is_card[:, cols[-1]-280:cols[-1]])
            if left_c > right_c:
                c_box = (cols[0], rows[0], cols[0] + 270, rows[-1])
            else:
                c_box = (cols[-1] - 270, rows[0], cols[-1], rows[-1])
        else:
            c_box = (cols[0], rows[0], cols[-1], rows[-1])
        card_img = im.crop(c_box)
        cw, ch = card_img.size
        # Center circle with strict bounds: 26% to 74%
        circle_img = card_img.crop((int(cw * 0.09), int(ch * 0.26), int(cw * 0.91), int(ch * 0.74)))
        
        # Apply circular mask
        ew, eh = circle_img.size
        c_mask = Image.new('L', (ew, eh), 0)
        cm_draw = ImageDraw.Draw(c_mask)
        cm_draw.ellipse([4, 4, ew - 4, eh - 4], fill=255)
        circle_img.putalpha(c_mask)
        
        return circle_img
    except Exception as e:
        print(f"Error extracting emblem from {im_path}: {e}")
        return None

def build_card(card_key, title_ar, category_ar, value_str, desc_ar, icon_img=None, is_num=False, palette_key='number'):
    card = Image.new('RGBA', (w, h), (0, 0, 0, 0))

    # Dark chassis
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
    elif icon_img:
        ic = icon_img.copy()
        ic.thumbnail((145, 140), Image.Resampling.LANCZOS)
        ix = (w - ic.width) // 2
        iy = 64 + (155 - ic.height) // 2
        card.paste(ic, (ix, iy), ic)

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

    draw.rounded_rectangle([w // 2 - 58, 39, w // 2 + 58, 55], radius=4, fill=c_glow, outline=gold, width=1)
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

    out_file = os.path.join(OUT_DIR, f"{card_key}.png")
    card.save(out_file)
    print(f"Generated: {card_key}.png")

for n in range(11):
    build_card(f"number_{n}", f"رقم {n}", "كارت أرقام", str(n),
               "اجمع 4 كروت من نفس الرقم (أو 3 + جوكر) لتكوين سيت كامل.",
               is_num=True, palette_key='number')

build_card("card_CA", "كارت كا", "رقم 11 خاص", "كا",
           "سيت كا = 4 كروت كا (أو 3 + جوكر). قيمة السيت 11 نقطة في نهاية الجولة.",
           is_num=True, palette_key='wild')

build_card("card_TCH", "كارت تش", "رقم 12 خاص", "تش",
           "سيت تش = 4 كروت تش (أو 3 + جوكر). قيمة السيت 12 نقطة في نهاية الجولة.",
           is_num=True, palette_key='wild')

actions_data = [
    ("magnatees",   "مغناطيس",   "أكشن هجومي",  "A", "اطلب أي رقم في إيدك، يجيلك فوراً من كل اللاعبين في نفس اللحظة!", 'attack'),
    ("special",     "اسبيشيال", "أكشن هجومي",  "A", "اطلب أي رقم في اللعبة حتى لو مش معاك في إيدك من أي لاعب تختاره!", 'wild'),
    ("el3ab_tani",  "العب تاني", "أكشن تكتيكي", "A", "العب دور إضافي فوراً بدون ما يمر الدور على اللاعب التالي!", 'utility'),
    ("od_le7afak",  "قد لحافك",  "أكشن هجومي",  "A", "اسرق لِمّة كاملة من أي لاعب بشرط يكون رقم اللِمّة مساوي لعدد كروت إيدك!", 'attack'),
    ("badl_edain",  "بدل إيدي",  "أكشن هجومي",  "A", "بدل كل كروت إيدك مع لاعب تختاره، أو بدل كروت اتنين لاعبين ببعض!", 'attack'),
    ("bos_bosa",    "بص بصة",    "أكشن كشف",    "A", "اكشف كارت سري من إيد أي لاعب لتكشف أوراقه وتخطط لطلبك الجاي!", 'utility'),
    ("sayad",       "صياد",      "أكشن سحب",    "A", "اسحب كارت عشوائي من إيد أي لاعب تختاره وضمه لكروتك فوراً!", 'attack'),
    ("hat_enta",    "هات انت",  "أكشن دفاعي",  "A", "اعكس الطلب في وجه من طلبه منك! انت اللي تاخد الكروت منه بدلاً من أن تعطيه!", 'defense'),
    ("kefaya_3leik","كفاية عليك","أكشن إيقاف",  "A", "أوقف اللاعب فوراً بعد أول طلب ناجح وانهي دوره ليتحول الدور للي بعده!", 'defense'),
    ("joker",       "جوكر",      "كارت ذهبي",   "★", "يكمل أي سيت ناقص! اجمع 3 كروت من نفس الرقم مع الجوكر واعمل سيت فوراً!", 'wild'),
    ("msh_shaifak", "مش شايفك", "أكشن حجب",    "A", "عطّل أي لاعب تختاره وميلعبش دوره القادم ويعدي عليه الدور!", 'defense'),
    ("kdab",        "كداب",      "أكشن مراوغة", "A", "مسموحلك تكذب وتقول معيش لما حد يطلب منك رقم حتى لو كان معاك فعلاً!", 'bluff'),
    ("mana3a",      "مناعة",     "حماية تامة",  "A", "حماية تامة راوند كامل من كل الطلبات والسرقات (ما عدا كارت المغناطيس)!", 'defense'),
    ("lef_w_erga3", "لف وارجع",  "عكس اتجاه",   "A", "اعكس اتجاه دوران اللعب فوراً من عقارب الساعة لعكسها أو العكس!", 'utility'),
    ("herbaiya",    "الحرباية",  "أكشن ناسخ",   "A", "قلد تأثير أي كارت أكشن نزل على الأرض أو اسرق كارت أكشن من خصمك!", 'wild')
]

for key, title, cat, val, desc, pal in actions_data:
    raw_path = os.path.join(PUBLIC_DIR, f"{key}.png")
    emblem = extract_emblem(raw_path)
    build_card(key, title, cat, val, desc, icon_img=emblem, is_num=False, palette_key=pal)

print("All cards rebuilt cleanly!")
