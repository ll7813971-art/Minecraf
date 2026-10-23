# Bastón de la Furia — Addon para Minecraft Bedrock

Añade un ítem especial, el **Bastón de la Furia** (`furia:rage_staff`).
Cuando golpeas a un mob con él, el mob se enfurece durante 60 segundos y
**ataca a cualquier ser vivo** que tenga cerca: otros mobs, animales, aldeanos
y jugadores (excepto al jugador que lo enfureció).

Funciona con cualquier mob, incluso los pacíficos (¡una vaca asesina!).
Las víctimas suelen defenderse, así que se arma el caos.

## Instalación

1. Descarga `dist/BastonDeLaFuria.mcaddon` y ábrelo: Minecraft importa los dos packs.
   (O copia `FuriaBP` a `development_behavior_packs` y `FuriaRP` a `development_resource_packs`.)
2. En tu mundo, activa el **Behavior Pack** "Bastón de la Furia (BP)"
   (el Resource Pack se activa solo por la dependencia).
3. Requiere Minecraft Bedrock **1.21.0 o superior**. No hace falta activar experimentos.

## Cómo conseguirlo

- Comando: `/give @s furia:rage_staff`
- Pestaña de equipamiento del inventario creativo.
- Receta (mesa de crafteo):

```
 . R .
 . B .
 . B .
```
`R` = bloque de redstone, `B` = vara de blaze.

## Ajustes

Al principio de `FuriaBP/scripts/main.js` puedes cambiar duración de la furia,
radio de búsqueda, daño, velocidad, y si puede atacar a su dueño (`ATTACK_OWNER`).

## Compilar

```
python3 tools/make_texture.py   # regenera la textura (opcional)
./tools/build.sh                # crea dist/BastonDeLaFuria.mcaddon
```
