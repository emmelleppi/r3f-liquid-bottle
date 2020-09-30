# Shader Materials

This is an example on how to setup a custom shader material.

We start by using the `shaderMaterial` helper from [`react-spring/drei`](https://github.com/react-spring/drei#%EF%B8%8F-shadermaterial-) to create a new ShaderMaterial with pre-configured get and set methods for each of our uniforms.

The glsl files will be compiled by [`glslify`](https://github.com/glslify/glslify), resolving any `require` statement in your shader code.

```jsx
import vertex from './vertex.glsl
import fragment from './fragment.glsl

const DeformMaterial = shaderMaterial({ time: 0, magnitude: 5. }, vertex, fragment);
```

Then, we use `react-three-fiber`'s extend to add this new material to the available components in r3f. This component will be available with the same name, lowercase initial:

```jsx
// in our material file
extend({ DeformMaterial });

// in our components, anywhere in the app
<shaderMaterial time={0.1} magnitude={5} />;
```

The shader code is in the `fragment.glsl` and `vertex.glsl` files.
