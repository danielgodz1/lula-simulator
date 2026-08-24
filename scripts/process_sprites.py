import os
import glob
from PIL import Image, ImageOps

SPRITES = {
    'lula': r'C:\Users\Daniel\.gemini\antigravity-ide\brain\b367972b-b4e7-48a2-8dc8-b09722a5d02e\lula_fly_1787536546884.jpg',
    'bolsonaro': r'C:\Users\Daniel\.gemini\antigravity-ide\brain\b367972b-b4e7-48a2-8dc8-b09722a5d02e\bolsonaro_fly_1787536559513.jpg',
    'dilma': r'C:\Users\Daniel\.gemini\antigravity-ide\brain\b367972b-b4e7-48a2-8dc8-b09722a5d02e\dilma_fly_1787536575416.jpg',
    'marcal': r'C:\Users\Daniel\.gemini\antigravity-ide\brain\b367972b-b4e7-48a2-8dc8-b09722a5d02e\marcal_fly_1787536592514.jpg',
    'moraes': r'C:\Users\Daniel\.gemini\antigravity-ide\brain\b367972b-b4e7-48a2-8dc8-b09722a5d02e\moraes_fly_1787536613104.jpg',
    'nikolas': r'C:\Users\Daniel\.gemini\antigravity-ide\brain\b367972b-b4e7-48a2-8dc8-b09722a5d02e\nikolas_fly_1787536633527.jpg',
    'janja': r'C:\Users\Daniel\.gemini\antigravity-ide\brain\b367972b-b4e7-48a2-8dc8-b09722a5d02e\janja_fly_1787536658898.jpg'
}

OUTPUT_DIR = r'c:\Users\Daniel\lula-simulator\img\characters'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def remove_background(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    # Any near-white pixel (r > 240 and g > 240 and b > 240) becomes transparent
    for item in datas:
        r, g, b, a = item
        # Calculate how close to pure white
        if r > 242 and g > 242 and b > 242:
            new_data.append((255, 255, 255, 0))
        elif r > 230 and g > 230 and b > 230:
            # Smooth anti-aliased edge
            diff = max(r, g, b) - 230
            alpha = int(255 * (1.0 - (diff / 13.0)))
            alpha = max(0, min(255, alpha))
            new_data.append((r, g, b, alpha))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Auto-crop to content bounding box
    bbox = img.getbbox()
    if bbox:
        # Add slight padding
        w, h = img.size
        pad = 8
        crop_box = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad))
        img = img.crop(crop_box)
        
    # Resize to crisp web standard size (e.g. height 240px with proportional width)
    target_height = 220
    ratio = target_height / float(img.height)
    target_width = int(img.width * ratio)
    img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
    
    img.save(out_path, "PNG", optimize=True)
    print(f"Processed: {out_path} ({target_width}x{target_height})")

for name, path in SPRITES.items():
    if os.path.exists(path):
        out = os.path.join(OUTPUT_DIR, f"{name}_fly.png")
        remove_background(path, out)
    else:
        print(f"File not found: {path}")

print("All sprites processed successfully!")
