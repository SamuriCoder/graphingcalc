// Vertex Shader
attribute vec2 a_position;
attribute vec4 a_color;

uniform mat4 u_matrix;
uniform float u_pointSize;

varying vec4 v_color;

void main() {
    gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
    gl_PointSize = u_pointSize;
    v_color = a_color;
}

// Fragment Shader
precision mediump float;

varying vec4 v_color;

void main() {
    gl_FragColor = v_color;
} 