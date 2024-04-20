// uniform sampler2D positionTexture; // from trailVariabe dependencies
// uniform sampler2D trailTexture; // from trailVariabe dependencies
uniform float time;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D(positionTexture, uv);
    vec3 position = tmpPos.xyz;
    gl_FragColor = vec4(tmpPos.x, tmpPos.y, 0.0, 1.0);
}