import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import screenVertexShader from "./glsl/screenVertex.glsl";
import screenFragmentShader from "./glsl/screenFragment.glsl";
import positionFragmentShader from "./glsl/positionFragment.glsl";
import trailFragmentShader from "./glsl/trailFragment.glsl";
import { GPUComputationRenderer } from "./GPUComputationRenderer";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { ParticleRenderer } from "./ParticleRenderer";

const quadVertexShader = `
varying vec2 vUv;
void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
}
`;

const quadFragmentShader = `
uniform sampler2D quadTexture;
varying vec2 vUv;
void main(){

    vec4 src = texture2D(quadTexture, vUv);
    gl_FragColor = vec4(src.r, src.g, src.b, 1. );

}
`;

const Gradient = () => {
  // This reference will give us direct access to the mesh
  // const mesh = useRef<THREE.Points<THREE.PlaneGeometry, THREE.ShaderMaterial>>(null!);
  const mesh = useRef<THREE.Mesh>(null!);

  const mousePosition = useRef({ x: 0, y: 0 });
  const width = 32;
  const { gl } = useThree();

  const gpuCompute = useMemo(() => {
    // width * width entities
    const gpuCompute = new GPUComputationRenderer(width, width, gl);

    // create a data texture for x,y position and heading
    const dtPosition = gpuCompute.createTexture();
    for (let i = 0; i < width * width; i++) {
      const i4 = i * 4;
      dtPosition.image.data[i4 + 0] = (Math.random() - 0.5) * 2; // x
      dtPosition.image.data[i4 + 1] = (Math.random() - 0.5) * 2; // y
      dtPosition.image.data[i4 + 2] = Math.random(); // heading
      dtPosition.image.data[i4 + 3] = 1;
    }

    const positionVariable = gpuCompute.addVariable("positionTexture", positionFragmentShader, dtPosition);
    positionVariable.material.uniforms["time"] = { value: 0 };
    positionVariable.material.uniforms["sa"] = { value: 2 };
    positionVariable.material.uniforms["ra"] = { value: 4 };
    positionVariable.material.uniforms["so"] = { value: 12 };
    positionVariable.material.uniforms["ss"] = { value: 0.1 };
    positionVariable.wrapS = THREE.RepeatWrapping;
    positionVariable.wrapT = THREE.RepeatWrapping;
    gpuCompute.setVariableDependencies(positionVariable, [positionVariable]);

    const dtTrail = gpuCompute.createTexture();
    const trailVariable = gpuCompute.addVariable("trailTexture", trailFragmentShader, dtTrail);
    gpuCompute.setVariableDependencies(trailVariable, [trailVariable, positionVariable]);
    // trailVariable.material.uniforms[""];

    gpuCompute.init();
    return gpuCompute;
  }, [gl]);

  const particleRenderer = useMemo(() => {
    const renderer = new ParticleRenderer(1024, 1024, width * width, gl);
    return renderer;
  }, [gl]);

  const uniforms = useMemo(
    () => ({
      time: { value: 0.0 },
      mouse: { value: new THREE.Vector2(0, 0) },
      positionTexture: { value: null },
      quadTexture: { value: null },
    }),
    []
  );

  const positions = useMemo(() => {
    const uvs = new Float32Array(width * width * 3);
    for (let i = 0; i < width * width; i++) {
      uvs.set([(i % width) / width, ~~(i / width) / width, 0], i * 3);
      // [
      //   [0.0,0.0], [0.2,0.0], [0.4,0.0], [0.6,0.0], [0.8,0.0],
      //   [0.0,0.2], [0.2,0.2], [0.4,0.2], [0.6,0.2], [0.8,0.2],
      //   ...
      // ]
      // eg processing particle 8 = vertex7 = attributes.positionOffset[7] = [0.4, 0.2]
      // In vertex shader: use positionOffset to lookup position in positionTexture
      //   attribute vec2 positionOffset;
      //   vec2 pos = texture2d(positionTexture, positionOffset).xy;
      //   gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);
    }
    return uvs;
  }, []);

  // const updateMousePosition = useCallback((e: MouseEvent) => {
  //   mousePosition.current = { x: e.pageX, y: e.pageY };
  // }, []);
  // useEffect(() => {
  //   window.addEventListener("mousemove", updateMousePosition, false);
  //   return () => {
  //     window.removeEventListener("mousemove", updateMousePosition, false);
  //   };
  // }, [updateMousePosition]);

  useFrame((state) => {
    const { clock } = state;
    // update particle positions
    gpuCompute.variables[0].material.uniforms["time"] = { value: clock.getElapsedTime() };
    gpuCompute.compute();

    // draw particles to texture
    particleRenderer.render(gpuCompute.getCurrentRenderTarget(gpuCompute.variables[0]).texture);

    // post process rendered particles

    // draw renderer particles texture to screen as quad
    mesh.current.material.uniforms.quadTexture.value = particleRenderer.renderTarget.texture;

    // mesh.current.material.uniforms.time.value = clock.getElapsedTime();
    // mesh.current.material.uniforms.mouse.value = new THREE.Vector2(mousePosition.current.x, mousePosition.current.y);
    // mesh.current.material.uniforms.positionTexture.value = gpuCompute.getCurrentRenderTarget(gpuCompute.variables[0]).texture;
  });

  return (
    // <points ref={mesh}>
    //   <bufferGeometry>
    //     <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
    //   </bufferGeometry>
    //   <shaderMaterial fragmentShader={screenFragmentShader} vertexShader={screenVertexShader} uniforms={uniforms} />
    // </points>
    <mesh ref={mesh}>
      <planeGeometry />
      <shaderMaterial fragmentShader={quadFragmentShader} vertexShader={quadVertexShader} uniforms={uniforms} />
    </mesh>
  );
};

const Scene = () => {
  return (
    <Canvas camera={{ position: [0, 0, 1.5] }}>
      {/* <OrthographicCamera makeDefault left={-1} top={1} right={1} bottom={-1} near={0.0000000001} far={1} /> */}
      <OrbitControls />
      <color attach="background" args={["#002"]} />
      <Gradient />
      <gridHelper />
      <axesHelper />
    </Canvas>
  );
};

export default Scene;
