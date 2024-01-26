import { DetectedObject } from "@tensorflow-models/coco-ssd";

export function drawOnCanvas(
  mirrored: boolean,
  predictions: DetectedObject[],
  ctx: CanvasRenderingContext2D | null | undefined
) {
  predictions.forEach((detectedObject: DetectedObject) => {
    const { class: name, bbox, score } = detectedObject;
    const [x, y, width, height] = bbox;

    if (ctx) {
      ctx.beginPath();

      // Styles
      ctx.fillStyle = name === "person" ? "#FF0F0F" : "#00B612";
      ctx.globalAlpha = 0.4;

      mirrored
        ? ctx.roundRect(ctx.canvas.width - x, y, -width, height, 8)
        : ctx.roundRect(x, y, width, height, 8);

      // Draw
      ctx.fill();

      // Text Styles
      ctx.font = "12px Courier New";
      ctx.globalAlpha = 1;

      ctx.fillText(name, x, y);
    }
  });
}
