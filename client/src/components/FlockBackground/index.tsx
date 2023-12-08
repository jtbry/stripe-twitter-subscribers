import { PropsWithChildren, useEffect, useRef } from "react";
import Flock from "./Flock";
import Vector from "./Vector";
import { settings } from "./settings";

const FlockBackground = ({ children }: PropsWithChildren): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flock = useRef<Flock | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    settings.MOUSE_POSITION = new Vector(-9001, 0);
    flock.current = new Flock(canvas.id);
    flock.current.enable();
  });

  return (
    <>
      <canvas id="flock-bg" style={{ position: "absolute" }} ref={canvasRef} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </>
  );
};

export default FlockBackground;
