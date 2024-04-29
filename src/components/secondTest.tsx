import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import React, { Suspense, useMemo, useRef } from "react";
import { Points, ShaderMaterial } from "three";

const Particles = () => {
  const count = 1000;
  const radius = 7;

  const pointsRef = useRef<Points>(null);

  const uniforms = useMemo(
    () => ({
      uTime: {
        value: 0.0,
      },
      uRadius: {
        value: radius,
      },
    }),
    [],
  );

  const vertexShader = `
  uniform float uTime;
  uniform float uRadius;

  // Source: https://github.com/dmnsgn/glsl-rotate/blob/main/rotation-3d-y.glsl.js
  mat3 rotation3dY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
      c  , 0.0, -s,
      0.0, 1.0, 0.0,
      s  , 0.0, c
    );
  }

  void main() {
    float distanceFactor = pow(uRadius - distance(position, vec3(0.0)), 1.5);
    float size = distanceFactor * 1.5 + 3.0;
    vec3 particlePosition = position * rotation3dY(uTime * 0.3 * distanceFactor);

    vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    gl_PointSize = size;
    // Size attenuation;
    gl_PointSize *= (1.0 / - viewPosition.z);
  }
  `;

  const fragmentShader = `
  varying float vDistance;

  void main() {
    vec3 color = vec3(0.34, 0.53, 0.96);
    // Create a strength variable that's bigger the closer to the center of the particle the pixel is
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    // Make it decrease in strength *faster* the further from the center by using a power of 3
    strength = pow(strength, 3.0);

    // Ensure the color is only visible close to the center of the particle
    color = mix(vec3(0.0), color, strength);
    gl_FragColor = vec4(color, strength);
  }
  `;

  const particleWiggleDirection = useMemo(() => {
    const direction = new Float32Array(count);
    for (let i = 0; i < count; i++) direction[i] = Math.random() * 2 * Math.PI;
    return direction;
  }, []);

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let x = 0,
        y = 0,
        z = 0;
      x = i * 0.1 * Math.random();
      y = i * 0.1 * Math.random();
      // 2D
      // z = i * 0.1;
      positions.set([x, y, z], i * 3);
    }
    return positions;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    if (!pointsRef.current.geometry.attributes.position) return;

    const material = pointsRef.current.material as ShaderMaterial;
    if (!material.uniforms || !material.uniforms.uTime) return;

    const time = clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      pointsRef.current.geometry.attributes.position.array[i * 3] +=
        0.0008 *
        (Math.floor(time) % 2 === 0 ? 1 : -1) *
        Math.sin(particleWiggleDirection[i]!);
      pointsRef.current.geometry.attributes.position.array[i * 3 + 1] +=
        0.0008 *
        (Math.floor(time) % 2 === 0 ? 1 : -1) *
        Math.cos(particleWiggleDirection[i]!);
    }

    // Used to re-render the canvas i think
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={particlesPosition}
          count={particlesPosition.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      {/* <pointsMaterial
        size={0.012}
        color="#5786F5"
        sizeAttenuation
        depthWrite={false}
      /> */}
      <shaderMaterial
        depthWrite={false}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </points>
  );
};

const secondTest = () => {
  return (
    <div className="relative h-screen w-screen">
      <Suspense>
        <Canvas className="z-50 h-full w-full bg-black">
          <ambientLight intensity={0.5} />
          <Particles />
          {/* <OrbitControls /> */}
        </Canvas>
      </Suspense>
    </div>
  );
};

export default secondTest;
