export const toMapPixel = ({ x, y, maxX, maxY, imageWidth, imageHeight }) => {
    const gx = Number(x);
    const gy = Number(y);
    const mx = Number(maxX);
    const my = Number(maxY);
    const width = Number(imageWidth);
    const height = Number(imageHeight);

    if (
        !Number.isFinite(gx) ||
        !Number.isFinite(gy) ||
        !Number.isFinite(mx) ||
        !Number.isFinite(my) ||
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        mx <= 0 ||
        my <= 0 ||
        width <= 0 ||
        height <= 0
    ) {
        return null;
    }

    const normalizedX = Math.min(Math.max(gx, 0), mx) / mx;
    const normalizedY = Math.min(Math.max(gy, 0), my) / my;

    return {
        pixelX: normalizedX * width,
        pixelY: normalizedY * height
    };
};
