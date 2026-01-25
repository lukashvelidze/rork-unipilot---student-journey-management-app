#!/usr/bin/env python3
import json
import sys
from pathlib import Path

try:
    from PIL import Image, ImageFilter
except Exception as exc:
    print("Pillow is required. Install with: python3 -m pip install pillow")
    raise SystemExit(1) from exc


ROOT = Path(__file__).resolve().parents[1]
ICON_JSON = ROOT / "assets" / "Unipilot.icon" / "icon.json"
ICON_ASSETS = ROOT / "assets" / "Unipilot.icon" / "Assets"
OUT_ICON = ROOT / "assets" / "images" / "icon.png"
IOS_ICON = (
    ROOT
    / "ios"
    / "UniPilot"
    / "Images.xcassets"
    / "AppIcon.appiconset"
    / "App-Icon-1024x1024@1x.png"
)


def parse_p3(value: str, fallback=(255, 255, 255, 255)):
    if not value or not isinstance(value, str):
        return fallback
    if ":" in value:
        _, value = value.split(":", 1)
    parts = [p.strip() for p in value.split(",")]
    if len(parts) < 3:
        return fallback
    nums = [float(p) for p in parts[:4]]
    r, g, b = [max(0.0, min(1.0, n)) for n in nums[:3]]
    a = max(0.0, min(1.0, nums[3] if len(nums) > 3 else 1.0))
    return (round(r * 255), round(g * 255), round(b * 255), round(a * 255))


def blend_channel(a: int, b: int, t: float) -> int:
    return round(a + (b - a) * t)


def blend(color, target, t):
    return (
        blend_channel(color[0], target[0], t),
        blend_channel(color[1], target[1], t),
        blend_channel(color[2], target[2], t),
    )


def make_background(color):
    size = 1024
    top = blend(color, (255, 255, 255), 0.06)
    bottom = blend(color, (0, 0, 0), 0.06)
    bg = Image.new("RGB", (size, size), top)
    px = bg.load()
    for y in range(size):
        t = y / (size - 1)
        r = blend_channel(top[0], bottom[0], t)
        g = blend_channel(top[1], bottom[1], t)
        b = blend_channel(top[2], bottom[2], t)
        for x in range(size):
            px[x, y] = (r, g, b)
    return bg.convert("RGBA")


def main():
    if not ICON_JSON.exists():
        print(f"Missing {ICON_JSON}")
        return 1

    data = json.loads(ICON_JSON.read_text())
    fill = data.get("fill", {})
    bg_color = parse_p3(fill.get("automatic-gradient") or fill.get("solid"))

    bg = make_background(bg_color[:3])

    groups = data.get("groups") or []
    layer = None
    for group in groups:
        layers = group.get("layers") or []
        if layers:
            layer = layers[0]
            break

    if layer and layer.get("image-name"):
        image_name = layer["image-name"]
        image_path = ICON_ASSETS / image_name
        if image_path.exists():
            hat = Image.open(image_path).convert("RGBA")
            hat_color = parse_p3(
                (layer.get("fill") or {}).get("solid"),
                fallback=(255, 0, 0, 255),
            )
            _, _, _, alpha = hat.split()
            solid = Image.new("RGBA", hat.size, hat_color)
            solid.putalpha(alpha)

            canvas = 1024
            scale = 1.0
            position = layer.get("position") or {}
            if isinstance(position.get("scale"), (int, float)):
                scale = float(position["scale"])
            base_size = min(hat.size)
            target = int(base_size * scale)
            max_size = int(canvas * 0.8)
            min_size = int(canvas * 0.45)
            target = max(min_size, min(max_size, target))
            solid = solid.resize((target, target), Image.LANCZOS)

            shadow = Image.new("RGBA", solid.size, (0, 0, 0, 90))
            shadow.putalpha(solid.split()[-1])
            shadow = shadow.filter(ImageFilter.GaussianBlur(14))

            dx, dy = 0, 0
            translation = position.get("translation-in-points")
            if isinstance(translation, (list, tuple)) and len(translation) >= 2:
                dx, dy = translation[0], translation[1]

            x = int((canvas - target) / 2 + dx)
            y = int((canvas - target) / 2 + dy)
            bg.alpha_composite(shadow, (x, y + 16))
            bg.alpha_composite(solid, (x, y))
        else:
            print(f"Missing layer asset: {image_path}")

    OUT_ICON.parent.mkdir(parents=True, exist_ok=True)
    IOS_ICON.parent.mkdir(parents=True, exist_ok=True)

    bg.save(OUT_ICON)
    bg.save(IOS_ICON)

    print(f"Wrote {OUT_ICON}")
    print(f"Wrote {IOS_ICON}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
