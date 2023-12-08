import Boid from "./Boid";
import Vector from "./Vector";
import { settings } from "./settings";

const Flock = function (canvas_id) {
  this.init(canvas_id);
};

Flock.prototype.init = function (canvas_id) {
  this.current_time = new Date().getTime();
  this.dt = 0;
  this.canvas = document.getElementById(canvas_id);

  this.canvas.width = window.innerWidth;
  this.canvas.height = window.innerHeight;

  this.width = this.canvas.width;
  this.height = this.canvas.height;

  this.ctx = this.canvas.getContext("2d");

  this.ctx.clearRect(0, 0, this.width, this.height);
  this.ctx.fillStyle = "#333";
  this.ctx.fillRect(0, 0, this.width, this.height);

  this.boids = [];

  for (var i = 0; i < settings.BOIDS; i++) {
    var boid = new Boid(
      new Vector(Math.random() * this.width, Math.random() * this.height),
      new Vector(Math.random(10), Math.random(10)),
      this.ctx
    );

    this.boids.push(boid);
  }
};

Flock.prototype.getCanvasContext = function () {
  return this.ctx;
};

Flock.prototype.enable = function () {
  window.requestAnimFrame = (function () {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame
    );
  })();

  this.animate(new Date().getTime());

  function doResize() {
    this.canvasResize();
  }

  var endResize;

  window.onresize = function () {
    clearTimeout(endResize);
    endResize = setTimeout(doResize, 100);
  };

  this.canvas.onmousemove = function (e) {
    var mouseX, mouseY;
    if (e.offsetX) {
      mouseX = e.offsetX;
      mouseY = e.offsetY;
    } else if (e.layerX) {
      mouseX = e.layerX;
      mouseY = e.layerY;
    }

    settings.MOUSE_POSITION = new Vector(mouseX, mouseY);
  };

  this.canvas.onmousedown = function (e) {
    if (e.which == 1 || e.which == 2 || e.button == 1)
      settings.AVOID_MOUSE = settings.AVOID_MOUSE ? false : true;
  };

  return this;
};

Flock.prototype.animate = function (time) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const that = this;
  this.animationFrame = window.requestAnimFrame(function () {
    that.animate(new Date().getTime());
  });
  this.update(time);
};

Flock.prototype.disable = function () {
  window.cancelAnimationFrame(this.animationFrame);

  return this;
};

Flock.prototype.canvasResize = function () {
  this.canvas.width = window.innerWidth;
  this.canvas.height = window.innerHeight;

  this.width = this.canvas.width;
  this.height = this.canvas.height;
};

Flock.prototype.update = function (time) {
  this.dt = time - this.current_time;

  this.current_time = time;

  this.draw();

  for (const i in this.boids) {
    this.boids[i].step(this.boids);
    this.boids[i].draw();
  }
};

Flock.prototype.draw = function () {
  if (!settings.DRAW_TRAILS) this.ctx.clearRect(0, 0, this.width, this.height);

  this.ctx.fillStyle = "#333";
  this.ctx.fillRect(0, 0, this.width, this.height);

  if (settings.AVOID_MOUSE) {
    this.ctx.beginPath();
    this.ctx.arc(
      settings.MOUSE_POSITION.x,
      settings.MOUSE_POSITION.y,
      settings.MOUSE_RADIUS,
      0,
      2 * Math.PI,
      false
    );
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    this.ctx.fill();
  }
};

export default Flock;
