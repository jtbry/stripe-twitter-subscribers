declare module "./Flock" {
  class Flock {
    constructor(canvas_id: string);
    update(time: number): void;
    draw(): void;
    enable(): void;
  }
}

export default Flock;
