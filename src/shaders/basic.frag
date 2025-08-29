uniform float time;
uniform vec3 color;

varying vec2 vUv;

void main() {
  vec3 finalColor = color * (0.5 + 0.5 * sin(time + vUv.x * 10.0));
  gl_FragColor = vec4(finalColor, 1.0);
}