const BoidStyleEnum = {
  Square: 0,
  Line: 1,
  Circle: 2,
};

const settings = {
  BOIDS: 100,
  MAX_SPEED: 2,
  MAX_FORCE: 0.15,
  MAX_SIZE: 10,
  DESIRED_SEPARATION: 6,
  NEIGHBOR_RADIUS: 50,
  SEPARATION_WEIGHT: 2,
  ALIGNMENT_WEIGHT: 1,
  COHESION_WEIGHT: 1,
  AVOID_MOUSE: false,
  MOUSE_POSITION: null,
  MOUSE_RADIUS: 50,
  MOUSE_SIGN: -1,
  MOUSE_FORCE: 0.1,
  BOID_STYLE: 2,
  DRAW_TRAILS: true,
};

export { BoidStyleEnum, settings };
