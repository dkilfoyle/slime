// render particles as points to a texture
// input = DataTexture containing x,y particle positions at each texel
//

import {
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  FloatType,
  NearestFilter,
  OrthographicCamera,
  Points,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Texture,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";

const vertexShader = `
uniform sampler2D particlePositionTexture;
void main(){
    vec2 uv = texture2D(particlePositionTexture, uv).xy;
    gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
    gl_PointSize = 4.0;
}`;

const fragmentShader = `
void main(){
    float d = 1.0 - length(0.5 - gl_PointCoord.xy);
    gl_FragColor = vec4(d, 0.0, 0.0, 1.0);
}`;

export class ParticleRenderer {
  renderTarget: WebGLRenderTarget;
  material: ShaderMaterial;
  scene: Scene;
  mesh: Points;
  camera: OrthographicCamera;

  constructor(public width: number, public height: number, public count: number, public renderer: WebGLRenderer) {
    // create a renderTarget that the particles will be drawn on
    const options = {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      type: FloatType,
    };
    this.renderTarget = new WebGLRenderTarget(width, height, options);
    const pixels = new Float32Array(width * height * 4);
    const texture = new DataTexture(pixels, width, height, RGBAFormat, FloatType);
    texture.needsUpdate = true;
    this.renderTarget.texture = texture;

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        particlePositionTexture: { value: null },
      },
      transparent: true,
    });

    // calculte u,v into particlePositionTexture for ith particle
    const size = Math.sqrt(count);
    const pos = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const u = (i % size) / size;
      const v = ~~(i / size) / size;
      const id = i * 2;
      uvs[id] = u;
      uvs[id + 1] = v;
    }

    this.mesh = new Points(
      new BufferGeometry().setAttribute("position", new BufferAttribute(pos, 3, false)).setAttribute("uv", new BufferAttribute(uvs, 2, true)),
      this.material
    );
    this.mesh.scale.set(width, height, 1);
    this.scene = new Scene().add(this.mesh);
    this.camera = new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 100);
    this.camera.position.z = 1;
  }

  render(particlePositionTexture: Texture) {
    this.mesh.visible = true;
    const currentRenderTarget = this.renderer.getRenderTarget();
    this.material.uniforms.particlePositionTexture.value = particlePositionTexture;
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(currentRenderTarget);
    // this.mesh.visible = false;
  }
}
