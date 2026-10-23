"""Genera la textura 16x16 del Bastón de la Furia."""
from PIL import Image

px = {
    "W": (90, 55, 25, 255),    # madera oscura
    "w": (140, 90, 45, 255),   # madera clara
    "R": (200, 20, 20, 255),   # gema roja
    "r": (255, 90, 60, 255),   # brillo de la gema
    "D": (110, 0, 0, 255),     # borde de la gema
}
art = [
    "................",
    "...........DDD..",
    "..........DRrRD.",
    "..........DRRRD.",
    "..........DRRRD.",
    "...........DDD..",
    "..........wW....",
    ".........wW.....",
    "........wW......",
    ".......wW.......",
    "......wW........",
    ".....wW.........",
    "....wW..........",
    "...wW...........",
    "..wW............",
    "................",
]
img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
for y, row in enumerate(art):
    for x, c in enumerate(row):
        if c in px:
            img.putpixel((x, y), px[c])
img.save("FuriaRP/textures/items/rage_staff.png")
img.resize((128, 128), Image.NEAREST).save("FuriaRP/pack_icon.png")
img.resize((128, 128), Image.NEAREST).save("FuriaBP/pack_icon.png")
