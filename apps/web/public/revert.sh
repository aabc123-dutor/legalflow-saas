pip3 install pillow numpy 2>/dev/null || pip3 install --user pillow numpy

python3 - << 'EOF'
from PIL import Image
import numpy as np

path = 'icono.png'
im = Image.open(path).convert('RGBA')
arr = np.array(im).astype(float)

rgb = arr[..., :3]
existing_alpha = arr[..., 3]

# luminancia: oscuro (líneas azules) -> opaco, claro (fondo) -> transparente
gray = rgb.mean(axis=2)
new_alpha = 255 - gray

# si ya había transparencia real, respétala combinándola
if existing_alpha.min() < 250:
    new_alpha = np.minimum(new_alpha, existing_alpha)

new_alpha = np.clip(new_alpha, 0, 255)

out = np.zeros_like(arr)
out[..., 0] = 255
out[..., 1] = 255
out[..., 2] = 255
out[..., 3] = new_alpha

Image.fromarray(out.astype('uint8'), 'RGBA').save(path)
print('Convertido a líneas blancas sobre transparente:', path)
EOF