# Smart 360 architecture

User flow: **Start scan → follow target → review → publish**.

The browser prototype uses continuous rear-camera video plus device orientation to guide coverage and automatically capture frames. It never asks the user to understand overlap or press a shutter.

Quality pipeline: frame sharpness/exposure/features → pose/coverage gate → reconstruction → seam/crop checks → panorama → hotspot suggestions → analytics.

`services/vision360` implements a working OpenCV reconstruction fallback. For production-grade mobile capture, keep the same API but use a native ARKit/ARCore capture bridge so camera poses and depth (when available) are known more accurately. This is how to reduce parallax instead of pretending arbitrary camera motion can be repaired perfectly afterward.

A "zero distortion" promise is not technically honest. The product should prevent bad capture, reject poor frames, request a tiny local rescan when needed, and report a quality score.
