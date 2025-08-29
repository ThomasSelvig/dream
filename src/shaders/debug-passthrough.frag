uniform sampler2D tDiffuse;

varying vec2 vUv;

void main() {
  // Simple passthrough - no effects
  vec4 color = texture2D(tDiffuse, vUv);
  gl_FragColor = color;
}