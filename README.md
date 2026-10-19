# Pyramid Lab

An interactive, client-side guide to Laplacian pyramids. Includes three generated sample images, local image uploads, Gaussian blur and pyramid depth controls, signed detail visualizations, and reconstruction with selectable detail layers.

## Run

From `/workspace/Engin183`, run `npm start` (Python 3 serves the static app on port 3000). No npm dependencies or installation are required. Run `npm test` for the numerical tests with Node.js 18 or newer.

The browser computes separable Gaussian filtering with replicated borders, factor-two decimation, and bilinear expansion. Laplacian levels store floating-point signed differences; the last Gaussian level is retained as the base. Reconstruction uses the identical expansion operator. Displayed residuals are offset by 128 and amplified threefold; only the display is clipped. Error is mean absolute RGB error on a 0–255 scale before display rounding. Inputs are limited to 320 × 240 pixels while preserving aspect ratio. Uploads never leave the device.

All app behavior works offline. Google Fonts is an optional visual enhancement with system font fallbacks.
