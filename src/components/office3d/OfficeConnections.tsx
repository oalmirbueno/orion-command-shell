/**
 * Office 3D — Animated data flow connections
 * Lines with moving particles between orchestrator and active agents.
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Static base line (subtle) */
function BaseLine({ curve, color, opacity = 0.06 }: { curve: THREE.CatmullRomCurve3; color: string; opacity?: number }) {
  const points = useMemo(() => curve.getPoints(24), [curve]);
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

/** Animated particle traveling along a curve */
function FlowParticle({ curve, color, speed = 0.4, offset = 0 }: {
  curve: THREE.CatmullRomCurve3;
  color: string;
  speed?: number;
  offset?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = ((state.clock.elapsedTime * speed + offset) % 1 + 1) % 1;
    const pos = curve.getPointAt(t);
    ref.current.position.copy(pos);

    // Trail follows slightly behind
    if (trailRef.current) {
      const tt = ((t - 0.03) + 1) % 1;
      const tp = curve.getPointAt(tt);
      trailRef.current.position.copy(tp);
    }
  });

  return (
    <>
      <mesh ref={ref}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <mesh ref={trailRef}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
    </>
  );
}

/** A single animated connection with base line + flow particles */
export function FlowConnection({ from, to, color, active, particleCount = 2 }: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  active: boolean;
  particleCount?: number;
}) {
  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      Math.max(from[1], to[1]) + 0.6,
      (from[2] + to[2]) / 2,
    ];
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to),
    ]);
  }, [from, to]);

  return (
    <group>
      <BaseLine curve={curve} color={color} opacity={active ? 0.12 : 0.04} />
      {active && Array.from({ length: particleCount }, (_, i) => (
        <FlowParticle
          key={i}
          curve={curve}
          color={color}
          speed={0.3 + i * 0.1}
          offset={i / particleCount}
        />
      ))}
    </group>
  );
}

// Keep backward compat export
export function ConnectionLine({ from, to, color = "#ffffff", opacity = 0.1 }: {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
  opacity?: number;
}) {
  return <FlowConnection from={from} to={to} color={color} active={false} />;
}
