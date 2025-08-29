uniform vec3 diffuse;
uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform float lightIntensity;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vec3 lightDir = normalize(lightPosition - vPosition);
  float lambertian = max(dot(vNormal, lightDir), 0.0);
  
  vec3 viewDir = normalize(-vPosition);
  vec3 reflectDir = reflect(-lightDir, vNormal);
  float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
  
  vec3 color = diffuse * lightColor * lightIntensity * (0.1 + lambertian + specular * 0.5);
  gl_FragColor = vec4(color, 1.0);
}