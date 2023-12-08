import Vector from "./Vector";
import { BoidStyleEnum, settings } from "./settings";

class Boid {
  constructor(location, velocity, ctx) {
    this.init(location, velocity, ctx);
  }
  init(location, velocity, ctx, settings) {
    this.loc = location.duplicate();
    this.velocity = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
    this.ctx = ctx;
    this.settings = settings;
  }
  step(neighbors) {
    var acceleration = this.flock(neighbors).add(this.influence());
    this.velocity.add(acceleration).limit(settings.MAX_SPEED);
    this.loc.add(this.velocity);
    this.wrapToCanvasBounds();
  }
  wrapToCanvasBounds() {
    this.loc.x = this.loc.x < 0 ? this.ctx.canvas.width : this.loc.x;
    this.loc.x = this.loc.x > this.ctx.canvas.width ? 0 : this.loc.x;
    this.loc.y = this.loc.y < 0 ? this.ctx.canvas.height : this.loc.y;
    this.loc.y = this.loc.y > this.ctx.canvas.height ? 0 : this.loc.y;
  }
  flock(neighbors) {
    var separation = this.separate(neighbors).multiply(
      settings.SEPARATION_WEIGHT
    );
    var alignment = this.align(neighbors).multiply(settings.ALIGNMENT_WEIGHT);
    var cohesion = this.cohere(neighbors).multiply(settings.COHESION_WEIGHT);

    return separation.add(alignment).add(cohesion);
  }
  cohere(neighbors) {
    var sum = new Vector(0, 0);
    var count = 0;

    for (const boid in neighbors) {
      var d = this.loc.distance(neighbors[boid].loc);
      if (d > 0 && d < settings.NEIGHBOR_RADIUS) {
        sum.add(neighbors[boid].loc);
        count++;
      }
    }

    if (count > 0) return this.steer_to(sum.divide(count));
    else return sum;
  }
  steer_to(target) {
    var desired = Vector.subtract(target, this.loc);
    var d = desired.magnitude();
    var steer;

    if (d > 0) {
      desired.normalize();

      if (d < 100) desired.multiply(settings.MAX_SPEED * (d / 100));
      else desired.multiply(settings.MAX_SPEED);

      steer = desired.subtract(this.velocity);
      steer.limit(settings.MAX_FORCE);
    } else {
      steer = new Vector(0, 0);
    }

    return steer;
  }
  align(neighbors) {
    var mean = new Vector();
    var count = 0;
    for (const boid in neighbors) {
      var d = this.loc.distance(neighbors[boid].loc);
      if (d > 0 && d < settings.NEIGHBOR_RADIUS) {
        mean.add(neighbors[boid].velocity);
        count++;
      }
    }

    if (count > 0) mean.divide(count);

    mean.limit(settings.MAX_FORCE);

    return mean;
  }
  separate(neighbors) {
    var mean = new Vector();
    var count = 0;

    for (const boid in neighbors) {
      var d = this.loc.distance(neighbors[boid].loc);
      if (d > 0 && d < settings.DESIRED_SEPARATION) {
        mean.add(
          Vector.subtract(this.loc, neighbors[boid].loc).normalize().divide(d)
        );
        count++;
      }
    }

    if (count > 0) mean.divide(count);

    return mean;
  }
  //a catch-all function for outside influences on the boids
  //just for avoiding the mouse force-field at this point.
  //so i guess by 'catch-all' i meant 'catch-just-the-one-thing' :/
  influence() {
    var g = new Vector();

    if (settings.AVOID_MOUSE) {
      const mouse = Vector.subtract(settings.MOUSE_POSITION, this.loc);
      let d = mouse.magnitude() - settings.MOUSE_RADIUS;

      if (d < 0) d = 0.01;

      if (d > 0 && d < settings.NEIGHBOR_RADIUS * 5)
        g.add(
          mouse
            .normalize()
            .divide(d * d)
            .multiply(settings.MOUSE_SIGN)
            .limit(settings.MOUSE_FORCE)
        );
    }

    return g;
  }
  draw() {
    var vv = (Math.abs(this.velocity.x) + Math.abs(this.velocity.y)) / 2;
    var color = "#ecf0f1";
    switch (settings.BOID_STYLE) {
      case BoidStyleEnum.Square:
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
          this.loc.x,
          this.loc.y,
          Math.min(vv * 5, settings.MAX_SIZE),
          Math.min(vv * 5, settings.MAX_SIZE)
        );
        break;
      case BoidStyleEnum.Line:
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(this.loc.x, this.loc.y);
        this.ctx.lineTo(
          this.loc.x + Math.min(this.velocity.x * 5, settings.MAX_SIZE),
          this.loc.y + Math.min(this.velocity.y * 5, settings.MAX_SIZE)
        );
        this.ctx.stroke();
        break;
      case BoidStyleEnum.Circle:
        this.ctx.beginPath();
        this.ctx.arc(
          this.loc.x,
          this.loc.y,
          Math.min(vv * 3, settings.MAX_SIZE),
          0,
          2 * Math.PI,
          false
        );
        this.ctx.fillStyle = color;
        this.ctx.fill();
        break;
      default:
        this.ctx.beginPath();
        this.ctx.arc(
          this.loc.x,
          this.loc.y,
          Math.min(vv * 3, settings.MAX_SIZE),
          0,
          2 * Math.PI,
          false
        );
        this.ctx.fillStyle = color;
        this.ctx.fill();
        break;
    }
  }
}

export default Boid;
