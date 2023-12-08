const Vector = (function () {
  var name, _fn, _i, _len, _ref;

  _ref = ["add", "subtract", "multiply", "divide"];

  _fn = function (name) {
    return (Vector[name] = function (a, b) {
      return a.duplicate()[name](b);
    });
  };

  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    name = _ref[_i];
    _fn(name);
  }

  function Vector(x, y) {
    if (x == null) x = 0;

    if (y == null) y = 0;

    (this.x = x), (this.y = y);
  }

  Vector.prototype.duplicate = function () {
    return new Vector(this.x, this.y);
  };

  Vector.prototype.magnitude = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  };

  Vector.prototype.normalize = function () {
    var m;

    m = this.magnitude();

    if (m > 0) this.divide(m);

    return this;
  };

  Vector.prototype.limit = function (max) {
    if (this.magnitude() > max) {
      this.normalize();

      return this.multiply(max);
    } else {
      return this;
    }
  };

  Vector.prototype.heading = function () {
    return -1 * Math.atan2(-1 * this.y, this.x);
  };

  Vector.prototype.eucl_distance = function (other) {
    var dx, dy;

    dx = this.x - other.x;
    dy = this.y - other.y;

    return Math.sqrt(dx * dx + dy * dy);
  };

  Vector.prototype.distance = function (other, dimensions) {
    var dx, dy;

    if (dimensions == null) dimensions = false;

    dx = Math.abs(this.x - other.x);
    dy = Math.abs(this.y - other.y);

    if (dimensions) {
      dx = dx < dimensions.width / 2 ? dx : dimensions.width - dx;
      dy = dy < dimensions.height / 2 ? dy : dimensions.height - dy;
    }

    return Math.sqrt(dx * dx + dy * dy);
  };

  Vector.prototype.subtract = function (other) {
    this.x -= other.x;
    this.y -= other.y;

    return this;
  };

  Vector.prototype.add = function (other) {
    this.x += other.x;
    this.y += other.y;

    return this;
  };

  Vector.prototype.divide = function (n) {
    (this.x = this.x / n), (this.y = this.y / n);

    return this;
  };

  Vector.prototype.multiply = function (n) {
    (this.x = this.x * n), (this.y = this.y * n);

    return this;
  };

  Vector.prototype.dot = function (other) {
    return this.x * other.x + this.y * other.y;
  };

  Vector.prototype.projectOnto = function (other) {
    return other.duplicate().multiply(this.dot(other));
  };

  Vector.prototype.wrapRelativeTo = function (location, dimensions) {
    var a, d, key, map_d, v, _ref1;

    v = this.duplicate();
    _ref1 = {
      x: "width",
      y: "height",
    };

    for (a in _ref1) {
      key = _ref1[a];
      d = this[a] - location[a];
      map_d = dimensions[key];
      if (Math.abs(d) > map_d / 2) {
        if (d > 0) {
          v[a] = (map_d - this[a]) * -1;
        } else {
          v[a] = this[a] + map_d;
        }
      }
    }
    return v;
  };

  Vector.prototype.invalid = function () {
    return (
      this.x === Infinity ||
      isNaN(this.x) ||
      this.y === Infinity ||
      isNaN(this.y)
    );
  };

  return Vector;
})();

export default Vector;
