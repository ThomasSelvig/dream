uniform sampler2D tDiffuse;

varying vec2 vUv;

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  
  // Simple saturation boost
  float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(luminance), color.rgb, 2.0); // 2x saturation
  
  gl_FragColor = color;
}