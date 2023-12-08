declare module "./Boid" {
  import Vector from "./Vector";

  class Boid {
    constructor(
      location: Vector,
      velocity: Vector,
      ctx: CanvasRenderingContext2D
    );
    init(
      location: Vector,
      velocity: Vector,
      ctx: CanvasRenderingContext2D,
      settings: typeof settings
    ): void;
    step(neighbors: Boid[]): void;
    wrapToCanvasBounds(): void;
  }
}

export default Boid;
