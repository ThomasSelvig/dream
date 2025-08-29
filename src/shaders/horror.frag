uniform float time;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vWorldPosition;

// Simple noise function for texture variation
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Cheap flickering effect
float flicker(float t) {
  return 0.7 + 0.3 * sin(t * 23.0) * sin(t * 17.0) * sin(t * 11.0);
}

void main() {
  // Base dark color palette
  vec3 baseColor = vec3(0.05, 0.02, 0.08); // Very dark purple
  vec3 accentColor = vec3(0.15, 0.05, 0.1); // Slight red tint
  
  // Subtle surface noise for texture
  float surfaceNoise = noise(vUv * 8.0 + time * 0.1);
  baseColor = mix(baseColor, accentColor, surfaceNoise * 0.3);
  
  // Rim lighting effect (objects glow slightly at edges)
  vec3 viewDir = normalize(-vPosition);
  float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
  rim = pow(rim, 3.0);
  
  // Flickering rim light
  float flickerValue = flicker(time);
  vec3 rimColor = vec3(0.2, 0.1, 0.15) * rim * flickerValue;
  
  // Distance-based darkness (farther = darker)
  float dist = length(vPosition);
  float darknessFactor = 1.0 - smoothstep(2.0, 15.0, dist);
  
  // Combine effects
  vec3 finalColor = baseColor + rimColor;
  finalColor *= darknessFactor;
  
  // Slight desaturation for eerie effect
  float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
  finalColor = mix(vec3(luminance), finalColor, 0.7);
  
  gl_FragColor = vec4(finalColor, 1.0);
}