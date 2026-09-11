export type Car = { x: number; z: number; heading: number; speed: number };
export type Input = { throttle: number; steer: number; brake: boolean };
export function stepCar(
  car: Car,
  input: Input,
  dt: number,
  b: { minX: number; maxX: number; minZ: number; maxZ: number },
) {
  dt = Math.min(dt, 0.05);
  let speed = car.speed;
  if (input.throttle) speed += input.throttle * 18 * dt;
  else speed *= Math.exp(-1.5 * dt);
  if (input.brake) speed *= Math.exp(-9 * dt);
  speed = Math.max(-12, Math.min(35, speed));
  if (Math.abs(speed) < 0.03) speed = 0;
  const heading =
    car.heading +
    input.steer *
      Math.min(Math.abs(speed) / 8, 1) *
      1.6 *
      dt *
      (speed < 0 ? -1 : 1);
  const rawX = car.x + Math.sin(heading) * speed * dt,
    rawZ = car.z - Math.cos(heading) * speed * dt;
  const x = Math.max(b.minX + 6, Math.min(b.maxX - 6, rawX)),
    z = Math.max(b.minZ + 6, Math.min(b.maxZ - 6, rawZ));
  return { x, z, heading, speed: x !== rawX || z !== rawZ ? 0 : speed };
}
