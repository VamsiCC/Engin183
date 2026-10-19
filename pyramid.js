// Floating-point RGB images; edge replication avoids dark borders.
export function blur(image, sigma) {
  const {w, h, data} = image;
  const radius = Math.ceil(3 * sigma);
  const kernel = Array.from({length: 2 * radius + 1}, (_, i) => Math.exp(-((i - radius) ** 2) / (2 * sigma ** 2)));
  const total = kernel.reduce((a, b) => a + b, 0);
  kernel.forEach((v, i) => kernel[i] = v / total);
  const temp = new Float64Array(data.length), result = new Float64Array(data.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
    let value = 0;
    for (let k = -radius; k <= radius; k++) value += data[(y * w + Math.max(0, Math.min(w - 1, x + k))) * 3 + c] * kernel[k + radius];
    temp[(y * w + x) * 3 + c] = value;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
    let value = 0;
    for (let k = -radius; k <= radius; k++) value += temp[(Math.max(0, Math.min(h - 1, y + k)) * w + x) * 3 + c] * kernel[k + radius];
    result[(y * w + x) * 3 + c] = value;
  }
  return {w, h, data: result};
}
export function reduce(image, sigma) {
  const smooth = blur(image, sigma), w = Math.ceil(image.w / 2), h = Math.ceil(image.h / 2);
  const data = new Float64Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) data[(y * w + x) * 3 + c] = smooth.data[(2 * y * image.w + 2 * x) * 3 + c];
  return {w, h, data};
}
// Bilinear expansion uses the same sampling grid as reduction, including odd sizes.
export function expand(image, w, h) {
  const data = new Float64Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const fx = x / 2, fy = y / 2, x0 = Math.min(Math.floor(fx), image.w - 1), y0 = Math.min(Math.floor(fy), image.h - 1);
    const x1 = Math.min(x0 + 1, image.w - 1), y1 = Math.min(y0 + 1, image.h - 1), dx = fx - x0, dy = fy - y0;
    for (let c = 0; c < 3; c++) data[(y * w + x) * 3 + c] = (image.data[(y0 * image.w + x0) * 3 + c] * (1 - dx) + image.data[(y0 * image.w + x1) * 3 + c] * dx) * (1 - dy) + (image.data[(y1 * image.w + x0) * 3 + c] * (1 - dx) + image.data[(y1 * image.w + x1) * 3 + c] * dx) * dy;
  }
  return {w, h, data};
}
export function buildPyramid(image, levels, sigma) {
  const gaussian = [image], laplacian = [];
  for (let i = 0; i < levels - 1; i++) {
    const previous = gaussian[i], next = reduce(previous, sigma), enlarged = expand(next, previous.w, previous.h);
    laplacian.push({w: previous.w, h: previous.h, data: previous.data.map((v, j) => v - enlarged.data[j])});
    gaussian.push(next);
  }
  return {gaussian, laplacian};
}
export function reconstruct(pyramid, enabled = pyramid.laplacian.map(() => true)) {
  let result = pyramid.gaussian.at(-1);
  for (let i = pyramid.laplacian.length - 1; i >= 0; i--) {
    const layer = pyramid.laplacian[i];
    result = expand(result, layer.w, layer.h);
    if (enabled[i]) result.data = result.data.map((v, j) => v + layer.data[j]);
  }
  return result;
}
export function meanError(a, b) {
  return a.data.reduce((sum, v, i) => sum + Math.abs(v - b.data[i]), 0) / a.data.length;
}
