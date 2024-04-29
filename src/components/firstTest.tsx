import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import image from "./image.json";

const Particles = () => {
  const count = 1000;

  const radius = 10;

  const points = useRef<THREE.Points>(null);

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const distance = Math.sqrt(Math.random()) * radius;
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);

      let x = distance * Math.sin(theta) * Math.cos(phi);
      let y = distance * Math.sin(theta) * Math.sin(phi);
      let z = 0;
      // let z = distance * Math.cos(theta);

      positions.set([x, y, z], i * 3);
    }

    return positions;
  }, [count]);

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#5786F5"
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

const Scene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const img = new Image();
  img.src = image.image;

  useEffect(() => {
    if (!canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    context.drawImage(
      img,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );

    var imageData = context?.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );

    for (var i = 0; i < imageData.data.length; i += 4) {
      var brightness =
        0.34 * (imageData.data[i] as number) +
        0.5 * (imageData.data[i + 1] as number) +
        0.16 * (imageData.data[i + 2] as number);
      imageData.data[i] = brightness;
      imageData.data[i + 1] = brightness;
      imageData.data[i + 2] = brightness;
    }

    context.putImageData(imageData as unknown as ImageData, 0, 0);

    var base64URI = canvasRef.current.toDataURL();

    img.src = base64URI;
    console.log(img.src);
  });

  if (2 !== 2) {
    return (
      <Canvas>
        <ambientLight intensity={0.5} />
        <Particles />
        <OrbitControls />
      </Canvas>
    );
  } else {
    return <canvas ref={canvasRef}></canvas>;
  }
};

export default Scene;
