import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'
import { useEffect, useRef } from 'react'

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform vec3 uColor;
uniform float uAmplitude;
uniform float uDistance;
uniform float uMirrored;

#define PI 3.1415926538

const int u_line_count = 40;
const float u_line_width = 7.0;
const float u_line_blur = 10.0;

float Perlin2D(vec2 P) {
    vec2 Pi = floor(P);
    vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
    vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
    Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
    Pt += vec2(26.0, 161.0).xyxy;
    Pt *= Pt;
    Pt = Pt.xzxz * Pt.yyww;
    vec4 hash_x = fract(Pt * (1.0 / 951.135664));
    vec4 hash_y = fract(Pt * (1.0 / 642.949883));
    vec4 grad_x = hash_x - 0.49999;
    vec4 grad_y = hash_y - 0.49999;
    vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y)
        * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
    grad_results *= 1.4142135623730950;
    vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy
               * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
    vec4 blend2 = vec4(blend, vec2(1.0 - blend));
    return dot(grad_results, blend2.zxzx * blend2.wwyy);
}

float pixel(float count, vec2 resolution) {
    return (1.0 / max(resolution.x, resolution.y)) * count;
}

float lineFn(vec2 st, float width, float perc, float offset, float time, float amplitude, float distance) {
    float split_offset = (perc * 0.4);
    float split_point = 0.1 + split_offset;

    float amplitude_normal = smoothstep(split_point, 0.7, st.x);
    float amplitude_strength = 0.5;
    float finalAmplitude = amplitude_normal * amplitude_strength * amplitude;

    float time_scaled = time / 10.0;
    float blur = smoothstep(split_point, split_point + 0.05, st.x) * perc;

    float xnoise = mix(
        Perlin2D(vec2(time_scaled, st.x + perc) * 2.5),
        Perlin2D(vec2(time_scaled, st.x + time_scaled) * 3.5) / 1.5,
        st.x * 0.3
    );

    float y = 0.5 + (perc - 0.5) * distance + xnoise / 2.0 * finalAmplitude;

    float line_start = smoothstep(
        y + (width / 2.0) + (u_line_blur * pixel(1.0, iResolution.xy) * blur),
        y,
        st.y
    );

    float line_end = smoothstep(
        y,
        y - (width / 2.0) - (u_line_blur * pixel(1.0, iResolution.xy) * blur),
        st.y
    );

    return clamp(
        (line_start - line_end) * (1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3))),
        0.0,
        1.0
    );
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 threadUv = uv;

    if (uMirrored > 0.5) {
        threadUv.x = abs(uv.x * 2.0 - 1.0);
    }

    float line_strength = 1.0;
    for (int i = 0; i < u_line_count; i++) {
        float p = float(i) / float(u_line_count);
        line_strength *= (1.0 - lineFn(
            threadUv,
            u_line_width * pixel(1.0, iResolution.xy) * (1.0 - p),
            p,
            (PI * 1.0) * p,
            iTime,
            uAmplitude,
            uDistance
        ));
    }

    float colorVal = 1.0 - line_strength;
    colorVal *= uMirrored > 0.5 ? smoothstep(0.0, 0.18, threadUv.x) : 1.0;
    fragColor = vec4(uColor * colorVal, colorVal);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`

export type UiBackgroundColor = [number, number, number]

export interface UiBackgroundProps {
  amplitude?: number
  color?: UiBackgroundColor
  distance?: number
  mirrored?: boolean
}

const defaultUiBackgroundColor: UiBackgroundColor = [0.48, 0.72, 0.28]

export function UiBackground({
  amplitude = 1,
  color = defaultUiBackgroundColor,
  distance = 0,
  mirrored = true,
}: UiBackgroundProps) {
  const animationFrameId = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const renderer = new Renderer({ alpha: true })
    const gl = renderer.gl

    gl.canvas.style.display = 'block'
    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    container.appendChild(gl.canvas)

    const geometry = new Triangle(gl)
    const program = new Program(gl, {
      fragment: fragmentShader,
      uniforms: {
        iResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        iTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColor: { value: new Color(...color) },
        uDistance: { value: distance },
        uMirrored: { value: mirrored ? 1 : 0 },
      },
      vertex: vertexShader,
    })

    const mesh = new Mesh(gl, { geometry, program })

    function resize() {
      const { clientHeight, clientWidth } = container
      if (!clientHeight || !clientWidth) return

      renderer.setSize(clientWidth, clientHeight)
      program.uniforms.iResolution.value.r = clientWidth
      program.uniforms.iResolution.value.g = clientHeight
      program.uniforms.iResolution.value.b = clientWidth / clientHeight
    }

    window.addEventListener('resize', resize)
    resize()

    function update(time: number) {
      program.uniforms.iTime.value = time * 0.001
      renderer.render({ scene: mesh })
      animationFrameId.current = requestAnimationFrame(update)
    }

    animationFrameId.current = requestAnimationFrame(update)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }

      window.removeEventListener('resize', resize)

      if (container.contains(gl.canvas)) {
        container.removeChild(gl.canvas)
      }

      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [amplitude, color, distance, mirrored])

  return <div className="relative h-full w-full" ref={containerRef} />
}
