import os
import shutil
from PIL import Image

SRC_PNG = r'Z:\CA TCH\png cards\png'
SRC_NEW_FOLDER = r'Z:\CA TCH\png cards\png\New folder'
OUT_DIR = r'Z:\CA TCH\public\cards'

os.makedirs(OUT_DIR, exist_ok=True)

print("Processing number cards...")
# Process numbers 0 to 10
for n in range(11):
    out_path = os.path.join(OUT_DIR, f"number_{n}.png")
    
    # Try PSD from New folder first
    psd_file = os.path.join(SRC_NEW_FOLDER, f"number_{n}.psd")
    png_new_file = os.path.join(SRC_NEW_FOLDER, f"number_{n}.png")
    png_main_file = os.path.join(SRC_PNG, f"number_{n}.png")
    
    converted = False
    
    # Check PSD first
    if os.path.exists(psd_file):
        try:
            im = Image.open(psd_file)
            im = im.convert("RGBA")
            im.save(out_path, "PNG")
            print(f"  Converted number_{n}.psd -> {im.size} RGBA PNG")
            converted = True
        except Exception as e:
            print(f"  Error reading {psd_file}: {e}")
            
    if not converted and os.path.exists(png_new_file):
        try:
            im = Image.open(png_new_file)
            im = im.convert("RGBA")
            im.save(out_path, "PNG")
            print(f"  Converted {png_new_file} -> {im.size} RGBA PNG")
            converted = True
        except Exception as e:
            print(f"  Error reading {png_new_file}: {e}")
            
    if not converted and os.path.exists(png_main_file):
        try:
            im = Image.open(png_main_file)
            im = im.convert("RGBA")
            im.save(out_path, "PNG")
            print(f"  Converted {png_main_file} -> {im.size} RGBA PNG")
            converted = True
        except Exception as e:
            print(f"  Fallback from main: {e}")
            
    if not converted:
        # Fallback to Z:\CA TCH\cards
        fallback = os.path.join(r"Z:\CA TCH\cards", f"number_{n}.png")
        if os.path.exists(fallback):
            im = Image.open(fallback).convert("RGBA")
            im.save(out_path, "PNG")
            print(f"  Fallback to cards/number_{n}.png")

print("\nProcessing action cards...")
action_files = [f for f in os.listdir(SRC_PNG) if f.endswith('.png') and not f.startswith('number_')]

for f in action_files:
    src_file = os.path.join(SRC_PNG, f)
    dst_file = os.path.join(OUT_DIR, f)
    try:
        im = Image.open(src_file).convert("RGBA")
        im.save(dst_file, "PNG")
        print(f"  Saved action card {f} -> {im.size}")
    except Exception as e:
        print(f"  Error on {f}: {e}")

# Also ensure badl_edain.png uses the centered version (badl_edain2.png)
try:
    im2 = Image.open(os.path.join(OUT_DIR, "badl_edain2.png"))
    im2.save(os.path.join(OUT_DIR, "badl_edain.png"), "PNG")
    print("  Ensured badl_edain.png uses high-quality centered version")
except Exception as e:
    pass

# Also ensure sayad.png uses sayad2.png
try:
    ims2 = Image.open(os.path.join(OUT_DIR, "sayad2.png"))
    ims2.save(os.path.join(OUT_DIR, "sayad.png"), "PNG")
    print("  Ensured sayad.png uses sayad2.png")
except Exception as e:
    pass

print("\n--- Verification of all files in public/cards ---")
all_files = sorted(os.listdir(OUT_DIR))
for f in all_files:
    p = os.path.join(OUT_DIR, f)
    try:
        im = Image.open(p)
        assert im.format == 'PNG', f"Format is {im.format}"
        print(f"  OK: {f:20} format={im.format} size={im.size} mode={im.mode}")
    except Exception as e:
        print(f"  FAIL: {f:20} {e}")

print(f"\nTotal verified cards: {len(all_files)}")
