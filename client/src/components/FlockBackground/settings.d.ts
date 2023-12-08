import Vector from "./Vector";

declare module "./settings" {
  export enum BoidStyleEnum {
    Square = 0,
    Line = 1,
    Circle = 2,
  }

  export interface Settings {
    BOIDS: number;
    MAX_SPEED: number;
    MAX_FORCE: number;
    MAX_SIZE: number;
    DESIRED_SEPARATION: number;
    NEIGHBOR_RADIUS: number;
    SEPARATION_WEIGHT: number;
    ALIGNMENT_WEIGHT: number;
    COHESION_WEIGHT: number;
    AVOID_MOUSE: boolean;
    MOUSE_POSITION: null | Vector;
    MOUSE_RADIUS: number;
    MOUSE_SIGN: number;
    MOUSE_FORCE: number;
    BOID_STYLE: BoidStyleEnum;
    DRAW_TRAILS: boolean;
  }

  const settings: Settings;
}

export { BoidStyleEnum, settings };
