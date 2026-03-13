import { useRef, useEffect, useState } from 'react';
import './LiquidBackground.css';

const useWebGLShader = (canvasRef, fragmentShader, props) => {
  const webglState = useRef(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: true });
    if (!gl) {
      console.error("WebGL is not supported in this browser.");
      return;
    }

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const compileShader = (source, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragShader = compileShader(fragmentShader, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const positionAttributeLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const uniformLocations = {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      iMouse: gl.getUniformLocation(program, 'iMouse'),
      uHue: gl.getUniformLocation(program, 'uHue'),
      uComplexity: gl.getUniformLocation(program, 'uComplexity'),
      uSpeed: gl.getUniformLocation(program, 'uSpeed'),
    };

    webglState.current = { gl, program, uniformLocations, vertexBuffer };

    return () => {
      if (gl && !gl.isContextLost()) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragShader);
        gl.deleteBuffer(vertexBuffer);
      }
    };
  }, [canvasRef, fragmentShader]);
  
  useEffect(() => {
    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        mousePos.current = {
            x: e.clientX / width,
            y: 1.0 - e.clientY / height,
        };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [canvasRef]);

  useEffect(() => {
    if (!webglState.current) return;
    
    const { gl, uniformLocations } = webglState.current;
    const startTime = performance.now();
    let animationFrameId;

    const handleResize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uniformLocations.iResolution, canvas.width, canvas.height);
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    const animate = () => {
      const time = ((performance.now() - startTime) / 1000.0);
      
      gl.uniform1f(uniformLocations.iTime, time);
      gl.uniform2f(uniformLocations.iMouse, mousePos.current.x, mousePos.current.y);
      gl.uniform1f(uniformLocations.uHue, props.hue);
      gl.uniform1f(uniformLocations.uComplexity, props.complexity);
      gl.uniform1f(uniformLocations.uSpeed, props.speed);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [webglState, canvasRef, props]);
};

export default function LiquidBackground({ hueTarget = 260, complexity = 1.0, speed = 0.8 }) {
  const canvasRef = useRef(null);
  
  // Slowly transition the hue towards the target for smooth theme/state changes
  const [currentHue, setCurrentHue] = useState(hueTarget);
  
  useEffect(() => {
    let animationFrame;
    const transitionHue = () => {
      setCurrentHue(prev => {
        const diff = hueTarget - prev;
        if (Math.abs(diff) < 1) return hueTarget;
        return prev + diff * 0.05;
      });
      animationFrame = requestAnimationFrame(transitionHue);
    };
    transitionHue();
    return () => cancelAnimationFrame(animationFrame);
  }, [hueTarget]);

  const fragmentShader = `
    precision highp float;
    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec2 iMouse;
    uniform float uHue;
    uniform float uComplexity;
    uniform float uSpeed;

    vec3 hsv2rgb(vec3 c) {
      vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
      return c.z * mix(vec3(1.0), rgb, c.y);
    }
    
    mat2 rotate2d(float angle) {
        return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    }
    
    mat3 rotationMatrix(vec3 axis, float angle) {
        axis = normalize(axis);
        float s = sin(angle);
        float c = cos(angle);
        float oc = 1.0 - c;
        return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
    }

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    float map(vec3 p) {
        float time = iTime * uSpeed;
        float twist = 3.0 * p.y; // Reduced twist for a calmer finance feel
        p.xz = rotate2d(twist) * p.xz;
        float displacement = snoise(p.xy * 2.0 + time) * 0.15 * uComplexity;
        float cyl = length(p.xz) - 0.6 + displacement;
        return cyl;
    }

    float rayMarch(vec3 ro, vec3 rd) {
        float d = 0.0;
        for(int i = 0; i < 80; i++) {
            vec3 p = ro + rd * d;
            float ds = map(p);
            d += ds;
            if(d > 50.0 || abs(ds) < 0.001) break;
        }
        return d;
    }
    
    vec3 getNormal(vec3 p) {
        vec2 e = vec2(0.001, 0.0);
        return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)
        ));
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
      vec2 mouse = (iMouse - 0.5) * 0.5; // Tone down mouse movement

      vec3 ro = vec3(0.0, 0.0, -4.0);
      vec3 rd = normalize(vec3(uv, 1.0));
      
      mat3 rot = rotationMatrix(normalize(vec3(mouse.y, mouse.x, 0.0)), length(mouse) * 1.5);
      ro = rot * ro;
      rd = rot * rd;

      float d = rayMarch(ro, rd);
      vec3 col = vec3(0.0);

      if (d < 50.0) {
        vec3 p = ro + rd * d;
        vec3 normal = getNormal(p);
        
        vec3 lightDir = normalize(vec3(1.0, 1.0, -1.0));
        float diffuse = max(dot(normal, lightDir), 0.0);
        
        float fresnel = pow(1.0 - max(dot(normal, -rd), 0.0), 3.0);
        
        // Deep vibrant color
        vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.6));
        vec3 reflectionColor = hsv2rgb(vec3((uHue + 30.0) / 360.0, 0.3, 1.0)); // Shimmer highlight
        
        col = baseColor * diffuse + reflectionColor * fresnel;
        col = mix(col, vec3(0.0), 1.0 - exp(-0.15 * d));
      }
      
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  useWebGLShader(canvasRef, fragmentShader, { hue: currentHue, complexity, speed });

  return (
    <canvas 
      ref={canvasRef} 
      className="liquid-background" 
      aria-hidden="true"
    />
  );
}
