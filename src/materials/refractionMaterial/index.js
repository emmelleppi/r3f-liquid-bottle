export const frag = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform sampler2D envMap;
uniform sampler2D backfaceMap;
uniform vec2 resolution;

varying vec3 worldNormal;
varying vec3 viewDirection;
varying vec2 vUv;

float ior = 1.5;
float a = 0.33;

vec3 fogColor = vec3(1.0);
vec3 reflectionColor = vec3(1.0);

float fresnelFunc(vec3 viewDirection, vec3 worldNormal) {
    return pow( 1.08 + dot( viewDirection, worldNormal), 10.0 );
}


const float ADC		= 0.03;	// adaptive depth control bailout	0.0 - 1.0
const float maxDist	= 20.;	// maximim draw distance			0.0 - ?.?

float rand(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 9.4821)))*43758.5453); }

vec3 rand3v(vec3 p) {
	mat3 m = mat3(15.2, 27.6, 35.7, 53.1, 75.8, 99.8, 153.2, 170.6, 233.7);
	return fract(sin(m * p) * 43648.23);
}

float s, c;
#define rotate(p, a) mat2(c=cos(a), s=-sin(a), -s, c) * p

vec4 mainImage() {
    vec2 uv		= vec2(gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
	vec2 mPos	= vec2(0.0, -3.0);    
    vec3 camPos	= vec3(.0, .0, -150.);
    vec3 rayDir	= normalize(vec3(uv, .8));
    rayDir.yz = rotate(rayDir.yz, mPos.y);
    rayDir.xz = rotate(rayDir.xz, mPos.x);
    
    camPos.y += time;
    
    vec3 adj, xV, yV, zV, V_;
    vec3 po	= sign(rayDir);
    vec3 V	= camPos, LV;
    float dist;
    
    vec4 RGBA	= vec4(vec3(0.), 1.);
    
    for(int i=0; i<10; i++) {
        dist = length(V-camPos);
        LV = V;
        adj = mix(floor(V+po), ceil(V+po), .5-.5*po) - V;
        
        xV = adj.x * vec3(1., rayDir.yz/rayDir.x);
        yV = adj.y * vec3(rayDir.xz/rayDir.y, 1.);
        zV = adj.z * vec3(rayDir.xy/rayDir.z, 1.);

        V_ = vec3(length(xV)<length(yV) ? xV : yV.xzy);
    	V_ = vec3(length(V_)<length(zV) ? V_ : zV);
        V += V_;

        if(dist>maxDist || RGBA.a<ADC) break;

        if(rand(floor((V+LV)/2.))>.5){
            float pRad = .25*fract(3.141592*rand(floor((V+LV)/2.)));
            vec3 pOff = 10. * rand3v(floor((V+LV)/2.));
            pOff = -vec3(sin(time+pOff.x), cos(time+pOff.y), sin(time+pOff.z))*pRad;
            vec3 pVec = camPos + rayDir * length(floor((V+LV)/2.)+.5-camPos-pOff)+pOff;
            float circ = length( pVec-floor((V+LV)/2.)-.5 )+.5-pRad*1.25;
            float alph = float(clamp(smoothstep(0.8, 0.9, 2.-5.*circ), 0., 1.));
            RGBA.rgb += RGBA.a * alph;
            RGBA.a *= 1.001 - alph;
       	}
    }
    
    return RGBA;
}

void main() {
    // screen coordinates
    vec2 uv = gl_FragCoord.xy / resolution;

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

    vec4 marcello = mainImage();

    gl_FragColor = vec4(color.rgb * vec3(1., 1., 0.) ,  0.9);
}`

export const vert = `varying vec3 worldNormal;
varying vec3 viewDirection;
varying vec2 vUv;

void main() {
    vUv = uv;

    vec4 transformedNormal = vec4(normal, 0.);
    vec4 transformedPosition = vec4(position, 1.0);
    #ifdef USE_INSTANCING
        transformedNormal = instanceMatrix * transformedNormal;
        transformedPosition = instanceMatrix * transformedPosition;
    #endif

    vec4 worldPosition = modelMatrix * vec4( position, 1.0);
    worldNormal = normalize( modelViewMatrix * transformedNormal).xyz;
    viewDirection = normalize(worldPosition.xyz - cameraPosition);;
    gl_Position = projectionMatrix * modelViewMatrix * transformedPosition;
}

`
