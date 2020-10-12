export const frag = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform sampler2D envMap;
uniform sampler2D backfaceMap;
uniform vec2 resolution;
uniform vec4 topColor;
uniform vec4 rimColor;
uniform vec4 foamColor;
uniform vec4 tint;
uniform float rim;
uniform float rimPower;

varying vec3 worldNormal;
varying vec3 viewDirection;
varying vec2 vUv;
varying vec4 worldPosition;
varying float fillEdge;

float ior = 1.5;
float a = 0.33;

vec3 fogColor = vec3(1.0);
vec3 reflectionColor = vec3(1.0);

float fresnelFunc(vec3 viewDirection, vec3 worldNormal) {
    return pow( 1.08 + dot( viewDirection, worldNormal), 10.0 );
}

void main() {
    // screen coordinates
    vec2 uv = gl_FragCoord.xy / resolution;

    // INIT REFRACTION SHADER
    // sample backface data from texture
    vec3 backfaceNormal = texture2D(backfaceMap, uv).rgb;

    // combine backface and frontface normal
    vec3 normal = worldNormal * (1.0 - a) - backfaceNormal * a;

    // calculate refraction and apply to uv
    vec3 refracted = refract(viewDirection, normal, 1.0/ior);
    uv += refracted.xy;

    // sample environment texture
    vec4 tex = texture2D(envMap, uv) ;

    // calculate fresnel
    float fresnel = fresnelFunc(viewDirection, normal);

    vec4 color = tex;

    // apply fresnel
    color.rgb = mix(color.rgb, reflectionColor, fresnel);
    // END REFRACTION SHADER
    
    
    // INIT LIQUID SHADER
    vec4 col = tint;
    float dotProduct = 1.0 - pow(dot(worldNormal, viewDirection), rimPower);
    vec4 RimResult = vec4(smoothstep(0.5, 1.0, dotProduct));
    RimResult *= rimColor;
    RimResult *= rimColor.w;
    
    // foam edge
    vec4 foam = vec4(step(fillEdge, 0.5) - step(fillEdge, (0.5 - rim)))  ;
    vec4 foamColored = foam * (foamColor * 0.9);

    // rest of the liquid
    vec4 result = step(fillEdge, 0.5) - foam;
    vec4 resultColored = result * col;
    
    // both together, with the texture
    vec4 finalResult = resultColored + foamColored;				
    finalResult.rgb += RimResult.rgb;

    // END LIQUID SHADER

    gl_FragColor = finalResult * color;
}`;

export const vert = `varying vec3 worldNormal;
varying vec3 viewDirection;
varying vec2 vUv;
varying vec4 worldPosition;
varying float fillEdge;

uniform float fillAmount;
uniform float wobbleX;
uniform float wobbleZ;

#define PI 3.1415926538

vec4 RotateAroundYInDegrees(vec4 vertex, float degrees)
{
   float alpha = degrees * PI / 180.0;
   float sina = sin(alpha);
   float cosa = cos(alpha);
   mat2 m = mat2(cosa, sina, -sina, cosa);
   return vec4(vertex.yz , m * vertex.xz).xzyw ;				
}

void main() {
    vUv = uv;

    vec4 transformedNormal = vec4(normal, 0.);
    vec4 transformedPosition = vec4(position, 1.0);
    #ifdef USE_INSTANCING
        transformedNormal = instanceMatrix * transformedNormal;
        transformedPosition = instanceMatrix * transformedPosition;
    #endif

    // get world position of the vertex
    worldPosition = modelMatrix * vec4(position, 1.0);
    // rotate it around XY
    vec3 worldPosX = RotateAroundYInDegrees(vec4(position, 0.0), 360.0).xyz;
    // rotate around XZ
    vec3 worldPosZ = vec3(worldPosX.y, worldPosX.z, worldPosX.x);		
    
    // combine rotations with worldPos, based on sine wave from script
    vec3 worldPosAdjusted = worldPosition.xyz + (worldPosX  * wobbleX) + (worldPosZ * wobbleZ); 
    
    // how high up the liquid is
    fillEdge =  worldPosAdjusted.y + fillAmount;

    worldNormal = normalize(modelViewMatrix * transformedNormal).xyz;
    viewDirection = normalize(worldPosition.xyz - cameraPosition);
    gl_Position = projectionMatrix * modelViewMatrix * transformedPosition;
}
`;
