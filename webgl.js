// ============================================================
// 2D Black Hole Ray Tracing — Newtonian + Relativistic (Fixed)
// ============================================================

export function resizeRayWebGL(gl, canvas) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

export function initRayWebGL(canvas) {
    // Restore: spawn ray on canvas click
    canvas.addEventListener("mousedown", e => {
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width * 2 - 1) * ASPECT;
        const y = 1 - (e.clientY - rect.top) / rect.height * 2;
        // Default direction: rightward
        addRay(x, y, 1, 0);
    });
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL2 required");
        return;
    }

    resizeRayWebGL(gl, canvas);
    gl.enable(gl.BLEND);

    // =========================================================
    // WORLD
    // =========================================================
    const ASPECT = canvas.width / canvas.height;
    const RAY_THICKNESS_CORE = 0.002;
    const RAY_THICKNESS_HALO = 0.008;
    const BG_COLOR = [0.13, 0.15, 0.19];

    // =========================================================
    // BLACK HOLE
    // =========================================================
    const BH = { x: 0.0, y: 0.0, r: 0.08 };
    const RS = BH.r * 0.9;

    // =========================================================
    // PHYSICS CONSTANTS
    // =========================================================
    const STEP = 0.004;
    const FADE_SPEED = 0.02;
    const G = 0.002;
    const PHOTON_CURVATURE = 0.018;
    const DENSITY_GAIN = 0.08;
    const DENSITY_DECAY = 0.992;

    // =========================================================
    // UI STATE
    // =========================================================
    let physicsMode = "relativistic";
    let showGrid = false;
    let dopplerEnabled = true;
    let timeDilationEnabled = true;

    document.getElementById("physicsMode")?.addEventListener("change", e => {
        physicsMode = e.target.value;
    });
    document.getElementById("showGrid")?.addEventListener("change", e => {
        showGrid = e.target.checked;
    });
    document.getElementById("dopplerToggle")?.addEventListener("change", e => {
        dopplerEnabled = e.target.checked;
    });
    document.getElementById("timeDilationToggle")?.addEventListener("change", e => {
        timeDilationEnabled = e.target.checked;
    });

    // =========================================================
    // SHADERS (UNCHANGED)
    // =========================================================
    const vsQuad = `#version 300 es
    in vec2 aPos;
    out vec2 vPos;
    void main(){ vPos=aPos; gl_Position=vec4(aPos,0,1); }`;

    const fsBackground = `#version 300 es
    precision highp float;
    in vec2 vPos;
    out vec4 fragColor;
    uniform vec2 bhPos;
    uniform float aspect;
    uniform vec3 bgColor;
    uniform float bhRadius;
    void main(){
        vec2 p=vPos; p.x*=aspect;
        float r=length(p-bhPos);
        float k=0.95;
        float d=log(1.0+k/max(r,0.1))/log(1.0+k/0.1);
        d=clamp(d,0.0,1.0);
        float maxR=bhRadius*2.5;
        float m=1.0-smoothstep(maxR*0.65,maxR,r);
        fragColor=vec4(bgColor*(1.0-0.99*d*m),1.0);
    }`;

    const fsGrid = `#version 300 es
    precision highp float;
    in vec2 vPos;
    out vec4 fragColor;
    uniform vec2 bhPos;
    uniform float aspect;
    uniform float warpStrength;
    float gridLine(float x){
        float g=abs(fract(x)-0.5);
        return smoothstep(0.48,0.5,g);
    }
    void main(){
        vec2 p=vPos; p.x*=aspect;
        vec2 d=p-bhPos;
        float r=length(d);
        float a=atan(d.y,d.x);
        float rs=r;
        if(warpStrength>0.0){
            rs=r+warpStrength*log(1.0+r/0.12);
        }
        vec2 w=bhPos+vec2(cos(a),sin(a))*rs;
        float g=max(gridLine(w.x*6.0),gridLine(w.y*6.0));
        fragColor=vec4(vec3(0.6,0.7,0.8)*g,0.35);
    }`;

    const vsRay = `#version 300 es
    in vec2 aPos;
    in float aFade;
    in vec2 aVel;
    in float aDen;
    out float vFade;
    out vec2 vVel;
    out float vDen;
    void main(){
        vFade=aFade;
        vVel=aVel;
        vDen=aDen;
        gl_Position=vec4(aPos,0,1);
    }`;

    const fsRayHalo = `#version 300 es
    precision highp float;
    in float vFade;
    out vec4 fragColor;
    void main(){
        fragColor=vec4(vec3(1.0,0.8,0.3),vFade*0.25);
    }`;

    const fsRayCore = `#version 300 es
    precision highp float;
    in float vFade;
    in vec2 vVel;
    in float vDen;
    out vec4 fragColor;

    uniform float dopplerOn;

    vec3 toneMap(vec3 c){ return c/(c+vec3(1.0)); }

    vec3 doppler(float b){
        b=clamp(b,-0.95,0.95);
        float D=sqrt((1.0+b)/(1.0-b));
        return mix(vec3(1.2,0.3,0.1),vec3(0.3,0.6,1.3),
                clamp((D-0.7)/(1.3-0.7),0.0,1.0));
    }

    void main(){
        float beta = dot(normalize(vVel), vec2(-1.0, 0.0));

        vec3 baseColor = vec3(1.0);
        if (dopplerOn > 0.5) {
            baseColor = doppler(beta);
        }

        float intensity = vFade * (1.0 + vDen);
        fragColor = vec4(toneMap(baseColor * 6.0 * intensity), 1.0);
    }`;


    const fsHole = `#version 300 es
    precision highp float;
    out vec4 fragColor;
    void main(){ fragColor=vec4(0,0,0,1); }`;

    const bgProgram = createProgram(gl, vsQuad, fsBackground);
    const gridProgram = createProgram(gl, vsQuad, fsGrid);
    const haloProgram = createProgram(gl, vsRay, fsRayHalo);
    const coreProgram = createProgram(gl, vsRay, fsRayCore);
    const holeProgram = createProgram(gl, vsQuad, fsHole);

    // =========================================================
    // BUFFERS
    // =========================================================
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posBuf = gl.createBuffer();
    const fadeBuf = gl.createBuffer();
    const velBuf = gl.createBuffer();
    const denBuf = gl.createBuffer();

    // =========================================================
    // BLACK HOLE GEOMETRY
    // =========================================================
    const holeVerts = [BH.x / ASPECT, BH.y];
    for (let i = 0; i <= 64; i++) {
        const a = i / 64 * Math.PI * 2;
        holeVerts.push((BH.x + Math.cos(a) * BH.r) / ASPECT, BH.y + Math.sin(a) * BH.r);
    }
    const holeBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, holeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(holeVerts), gl.STATIC_DRAW);

    // =========================================================
    // RAYS
    // =========================================================
    const rays = [];
    const MAX_RAYS = 120;

    function addRay(x, y, vx, vy) {
        rays.push({
            x, y, vx, vy,
            path: [[x / ASPECT, y]],
            density: 0,
            captured: false,
            exiting: false,
            life: 1
        });
        if (rays.length > MAX_RAYS) rays.shift();
    }

    function spawnInitialOrbitRays(count = 20) {
        const rMin = BH.r * 1.25;
        const rMax = BH.r * 4.2;
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = rMin + Math.random() * (rMax - rMin);
            let vx = -Math.sin(a), vy = Math.cos(a);
            vx += (Math.random() - 0.5) * 0.25;
            vy += (Math.random() - 0.5) * 0.25;
            const v = Math.hypot(vx, vy);
            addRay(BH.x + Math.cos(a) * r, BH.y + Math.sin(a) * r, vx / v, vy / v);
        }
    }
    spawnInitialOrbitRays();

    document.getElementById("clearRaysBtn")?.addEventListener("click", () => {
        rays.length = 0;
        // spawnInitialOrbitRays();
    });

    // =========================================================
    // PHYSICS STEPS
    // =========================================================
    function stepNewtonian(r) {
        const dx = r.x - BH.x, dy = r.y - BH.y;
        const d2 = dx * dx + dy * dy;
        if (Math.sqrt(d2) <= BH.r) { r.captured = true; return; }

        const a = -G / (d2 + 1e-6);
        r.vx += dx * a;
        r.vy += dy * a;

        const v = Math.hypot(r.vx, r.vy);
        r.vx /= v; r.vy /= v;

        r.x += r.vx * STEP;
        r.y += r.vy * STEP;
        r.path.push([r.x / ASPECT, r.y]);
    }

    function stepRelativistic(r) {
        const dx = r.x - BH.x, dy = r.y - BH.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= BH.r) { r.captured = true; return; }

        // curvature (NO time scaling)
        const bend = PHOTON_CURVATURE / (dist * dist * dist + 1e-4);
        const tx = -dy / dist, ty = dx / dist;
        r.vx += tx * bend;
        r.vy += ty * bend;

        const v = Math.hypot(r.vx, r.vy);
        r.vx /= v; r.vy /= v;

        // time dilation (optional)
        let dt = STEP;
        if (timeDilationEnabled) {
            const tScale = Math.sqrt(Math.max(0.5, (dist - RS) / dist));
            dt *= tScale;
        }

        r.x += r.vx * dt;
        r.y += r.vy * dt;
        r.path.push([r.x / ASPECT, r.y]);

        // density accumulation
        r.density = r.density * DENSITY_DECAY + dt * DENSITY_GAIN;
    }

    function stepRay(r) {
        if (r.life <= 0) return;

        if (physicsMode === "newtonian") {
            stepNewtonian(r);
        } else {
            stepRelativistic(r);
        }

        if (Math.abs(r.x) > ASPECT + 0.3 || Math.abs(r.y) > 1.3)
            r.exiting = true;

        if (r.captured || r.exiting)
            r.life -= FADE_SPEED;
    }

    // =========================================================
    // DRAW HELPERS (unchanged)
    // =========================================================
    function drawQuad(program, set) {
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        const loc = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        set((n, ...v) => {
            const u = gl.getUniformLocation(program, n);
            if (v.length === 1) gl.uniform1f(u, v[0]);
            if (v.length === 2) gl.uniform2f(u, v[0], v[1]);
            if (v.length === 3) gl.uniform3f(u, v[0], v[1], v[2]);
        });
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function drawRays(program, thickness) {
        const verts = [], fades = [], vels = [], dens = [];
        for (const r of rays) {
            for (let i = 1; i < r.path.length; i++) {
                const t = i / (r.path.length - 1);
                const f = Math.pow(t, 6) * r.life;
                const [x0, y0] = r.path[i - 1];
                const [x1, y1] = r.path[i];
                const dx = x1 - x0, dy = y1 - y0;
                const len = Math.hypot(dx, dy) || 1;
                const px = -dy / len * thickness;
                const py = dx / len * thickness;
                verts.push(
                    x0 - px, y0 - py, x0 + px, y0 + py, x1 + px, y1 + py,
                    x0 - px, y0 - py, x1 + px, y1 + py, x1 - px, y1 - py
                );
                for (let k = 0; k < 6; k++) {
                    fades.push(f);
                    vels.push(r.vx, r.vy);
                    dens.push(r.density);
                }
            }
        }

        gl.useProgram(program);

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
        let loc = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, fadeBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fades), gl.DYNAMIC_DRAW);
        loc = gl.getAttribLocation(program, "aFade");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 1, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, velBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vels), gl.DYNAMIC_DRAW);
        loc = gl.getAttribLocation(program, "aVel");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, denBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dens), gl.DYNAMIC_DRAW);
        loc = gl.getAttribLocation(program, "aDen");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 1, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
    }

    // =========================================================
    // DRAW
    // =========================================================
    function draw() {
        gl.clear(gl.COLOR_BUFFER_BIT);

        drawQuad(bgProgram, p => {
            p("bhPos", BH.x, BH.y);
            p("aspect", ASPECT);
            p("bgColor", ...BG_COLOR);
            p("bhRadius", BH.r);
        });

        if (showGrid) {
            drawQuad(gridProgram, p => {
                p("bhPos", BH.x, BH.y);
                p("aspect", ASPECT);
                p("warpStrength", physicsMode === "relativistic" ? 0.25 : 0.0);
            });
        }

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        drawRays(haloProgram, RAY_THICKNESS_HALO);

        gl.useProgram(coreProgram);
        gl.uniform1f(
            gl.getUniformLocation(coreProgram, "dopplerOn"),
            dopplerEnabled ? 1.0 : 0.0
        );

        gl.blendFunc(gl.ONE,gl.ONE);
        drawRays(coreProgram, RAY_THICKNESS_CORE);

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.useProgram(holeProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, holeBuf);
        const loc = gl.getAttribLocation(holeProgram, "aPos");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, holeVerts.length / 2);
    }

    // =========================================================
    // LOOP
    // =========================================================
    function animate() {
        for (const r of rays) stepRay(r);
        for (let i = rays.length - 1; i >= 0; i--)
            if (rays[i].life <= 0) rays.splice(i, 1);
        draw();
        requestAnimationFrame(animate);
    }

    animate();
}

// ============================================================
// SHADER HELPERS
// ============================================================
function createShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw gl.getShaderInfoLog(s);
    return s;
}
function createProgram(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, createShader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, createShader(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        throw gl.getProgramInfoLog(p);
    return p;
}
