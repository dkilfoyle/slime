// varying vec2 vUv;
uniform sampler2D positionTexture;

void main() {
  // vUv = uv;

  vec4 pos = texture2D(positionTexture, position.xy);
  vec4 mvPos = projectionMatrix * modelViewMatrix * vec4(pos.x, pos.y, 0.0, 1.0);

  gl_PointSize = 8.;
  gl_Position = mvPos;
  // gl_Position = vec4(pos,1.0);
}