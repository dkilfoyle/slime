uniform float time;
uniform float sa;
uniform float ra;
uniform float so;
uniform float ss;

const float PI  = 3.14159265358979323846264;// PI
const float PI2 = PI * 2.;
const float RAD = 1./PI;

float rand(float co) { return fract(sin(co*(91.3458)) * 47453.5453); }
// float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);}

void main() {
    // lookup particle position and angle from positionTexture
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D(positionTexture, uv);
    vec2 position = tmpPos.xy;
    float angle = tmpPos.z * PI2;

    vec2 ires = 1. / resolution;
    vec2 SO = so * ires;
    vec2 SS = ss * ires;

    // move forward
    vec2 offset = vec2(cos(angle), sin(angle)) * SS;
    position.xy += offset;

    // bounce off boundaries
    if (position.x <= -1.0 || position.x >= 1.0 || position.y <= -1.0 || position.y >= 1.0) {
        angle = rand(fract(time)) * PI2;
        position = clamp(position, -1.0, 1.0);
    }

    gl_FragColor = vec4(position.x, position.y, angle/PI2, 1.0);
}