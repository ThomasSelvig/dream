uniform sampler2D tDiffuse;
uniform float time;
uniform vec2 resolution;

varying vec2 vUv;

// Simple noise function
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Subtle flickering effect
float flicker(float t) {
  return 0.92 + 0.08 * sin(t * 8.0) * sin(t * 5.3);
}

void main() {
  vec2 uv = vUv;
  
  // Sample the original scene
  vec4 color = texture2D(tDiffuse, uv);
  
  // Gentle color grading - preserve visibility
  color.rgb = pow(color.rgb, vec3(1.05)); // Very subtle midtone adjustment
  color.rgb *= 0.85; // Mild brightness reduction
  
  // Add purple/red horror tint
  color.rgb *= vec3(1.0, 0.8, 0.9);
  
  // Subtle vignette effect
  vec2 center = uv - 0.5;
  float vignette = 1.0 - dot(center, center) * 0.4;
  vignette = smoothstep(0.5, 1.0, vignette);
  color.rgb *= vignette;
  
  // Subtle film grain/noise
  float grain = noise(uv * resolution * 0.5 + time * 2.0) * 0.05;
  color.rgb += grain;
  
  // Flickering light effect
  float flickerValue = flicker(time);
  color.rgb *= flickerValue;
  
  // Gentle contrast adjustment
  color.rgb = (color.rgb - 0.5) * 1.05 + 0.5;
  
  // Clamp to avoid overexposure
  color.rgb = clamp(color.rgb, 0.0, 1.0);
  
  gl_FragColor = color;
}