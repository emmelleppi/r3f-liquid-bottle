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

export const frag = `
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

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

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

    // color of backfaces/ top
    vec4 _topColor = topColor * (foam + result);

    //gl_FrontFacing is TRUE for front facing, FALSE for backfacing
    gl_FragColor = gl_FrontFacing ? finalResult : _topColor; 
}
`;
