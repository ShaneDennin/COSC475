// Vertex Shader
let vertexShaderSrc = `#version 300 es
// #pragma vscode_glsllint_stage: vert

in vec3 vertPosition;
in vec3 vertNormal;
in vec2 vertTex;

uniform mat4 projMatrix;
uniform mat4 modelToWorldMatrix;
uniform mat4 viewMatrix;
uniform vec3 lightPosition;


out vec3 fragPosition;
out vec3 fragNormal;
out vec2 fragTex;
out vec3 lightPos;


void main(){
    gl_Position = projMatrix * viewMatrix * modelToWorldMatrix * vec4(vertPosition,1.0);
    fragPosition = vec3(modelToWorldMatrix * vec4(vertPosition, 1.0));
    mat4 normalMatrix = transpose(inverse(modelToWorldMatrix));
    fragNormal = normalize(vec3( normalMatrix * vec4(vertNormal, 0.0)));
    fragTex = vertTex;
    lightPos = lightPosition;
}
`;
