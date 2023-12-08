declare module "./Vector" {
  class Vector {
    constructor(x: number, y: number);
    add(v: Vector): Vector;
    subtract(v: Vector): Vector;
    multiply(n: number): Vector;
    divide(n: number): Vector;
    magnitude(): number;
    normalize(): Vector;
    limit(max: number): Vector;
    heading(): number;
    // Add other methods as necessary
  }
}

export default Vector;
