// Fragment Shader
let fragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag
precision highp float;

in vec3 fragPosition;
in vec3 fragNormal;
in vec2 fragTex;
in vec3 lightPos;

uniform sampler2D uTexture;

uniform vec3 ambientLightColor;
uniform vec3 materialColor;
uniform vec3 diffuseLightColor;
uniform mat4 modelToWorldMatrix;


out vec4 outColor;

void main(){
    vec3 N = fragNormal;
    vec3 diffuseLightDirection = normalize(lightPos - fragPosition);
    float lambert = max(0.0, dot(N, diffuseLightDirection));
    vec3 Id = diffuseLightColor * materialColor * lambert;
    vec4 texColor = texture(uTexture, fragTex);
    vec3 Ia = ambientLightColor * materialColor;
    outColor = vec4(Ia + Id, 1.0) * texColor;
}
`;
