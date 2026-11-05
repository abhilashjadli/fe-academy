import { useEffect, useRef } from "react";
import { ROW, price } from "./row";
import { D_MAX, F_MAX, F_MIN, clampD, clampF, fromX, fromZ, snapD, snapF, surfaceGrid, toX, toY, toZ } from "./surface";

/**
 * The Three.js view of the price surface for Figure 2. `three` is imported dynamically so other chapters' bundles are
 * untouched; everything is disposed on unmount. Props drive the probe and the camera; the component never computes a
 * number for the page (the slice panel does that from the engine).
 */

type Three = typeof import("three");

export interface Probe {
  F: number;
  days: number;
}

interface Props {
  probe: Probe;
  onProbe: (p: Probe) => void;
  alongTime: boolean;
  /** height in CSS px */
  height?: number;
}

interface Palette {
  truth: string;
  ink: string;
  ink3: string;
  error: string;
  approx: string;
  raised: string;
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const get = (n: string, d: string) => cs.getPropertyValue(n).trim() || d;
  return {
    truth: get("--truth", "#2f5bea"),
    ink: get("--ink", "#1b2430"),
    ink3: get("--ink-3", "#7a8594"),
    error: get("--error", "#c8325f"),
    approx: get("--approx", "#b86e00"),
    raised: get("--surface-raised", "#ffffff"),
  };
}

/** camera on a ring around the surface: azimuth about the y axis, in radians */
const CAM = { front: { az: 0.42, el: 0.5, r: 5.8 }, side: { az: 0.42 + (80 * Math.PI) / 180, el: 0.3, r: 5.4 } };
const TARGET = [0.05, 0.38, 0] as const;

interface LabelDef {
  text: string;
  at: [number, number, number];
  cls?: string;
}

export function Surface3D({ probe, onProbe, alongTime, height = 400 }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const api = useRef<{ setProbe: (p: Probe) => void; setCamera: (side: boolean) => void } | null>(null);
  const probeRef = useRef(probe);
  probeRef.current = probe;
  const onProbeRef = useRef(onProbe);
  onProbeRef.current = onProbe;

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let dead = false;
    let cleanup: () => void = () => {};
    (async () => {
      const THREE: Three = await import("three");
      if (dead || !box.current) return;
      const el = box.current;
      let pal = readPalette();

      // --- renderer, scene, camera ---
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.className = "c4-gl";
      renderer.domElement.setAttribute("aria-label", "The call price as a surface over the index and the days left; drag to move the probe");
      renderer.domElement.setAttribute("role", "img");
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
      const target = new THREE.Vector3(...TARGET);
      const cam = { ...CAM.front };
      const placeCamera = () => {
        camera.position.set(target.x + cam.r * Math.cos(cam.el) * Math.sin(cam.az), target.y + cam.r * Math.sin(cam.el), target.z + cam.r * Math.cos(cam.el) * Math.cos(cam.az));
        camera.lookAt(target);
      };
      placeCamera();

      scene.add(new THREE.AmbientLight(0xffffff, 1.1));
      const sun = new THREE.DirectionalLight(0xffffff, 1.7);
      sun.position.set(2.5, 4, 3);
      scene.add(sun);
      const back = new THREE.DirectionalLight(0xffffff, 0.5);
      back.position.set(-3, 2, -2);
      scene.add(back);

      // --- the surface ---
      const grid = surfaceGrid();
      const pos = new Float32Array(grid.nx * grid.nz * 3);
      for (let j = 0; j < grid.nz; j++) {
        const days = (D_MAX * j) / (grid.nz - 1);
        for (let i = 0; i < grid.nx; i++) {
          const F = F_MIN + ((F_MAX - F_MIN) * i) / (grid.nx - 1);
          const k = (j * grid.nx + i) * 3;
          pos[k] = toX(F);
          pos[k + 1] = toY(grid.v[j * grid.nx + i]);
          pos[k + 2] = toZ(days);
        }
      }
      const idx: number[] = [];
      for (let j = 0; j < grid.nz - 1; j++)
        for (let i = 0; i < grid.nx - 1; i++) {
          const a = j * grid.nx + i,
            b = a + 1,
            c = a + grid.nx,
            d = c + 1;
          idx.push(a, c, b, b, c, d);
        }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const col = new Float32Array(grid.nx * grid.nz * 3);
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const lo = new THREE.Color(),
        hi = new THREE.Color(),
        tmp = new THREE.Color();
      const paint = () => {
        lo.set(pal.raised);
        hi.set(pal.truth);
        for (let k = 0; k < grid.nx * grid.nz; k++) {
          const u = 0.15 + 0.85 * Math.sqrt(grid.v[k] / grid.vmax);
          tmp.copy(lo).lerp(hi, u);
          col[k * 3] = tmp.r;
          col[k * 3 + 1] = tmp.g;
          col[k * 3 + 2] = tmp.b;
        }
        (geo.attributes.color as InstanceType<Three["BufferAttribute"]>).needsUpdate = true;
      };
      paint();
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.8, side: THREE.DoubleSide, roughness: 0.9, metalness: 0, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 1;
      scene.add(mesh);

      // wire: every 4th line each way
      const wire: number[] = [];
      for (let j = 0; j < grid.nz; j += 4)
        for (let i = 0; i < grid.nx - 1; i++) {
          const a = (j * grid.nx + i) * 3,
            b = a + 3;
          wire.push(pos[a], pos[a + 1], pos[a + 2], pos[b], pos[b + 1], pos[b + 2]);
        }
      for (let i = 0; i < grid.nx; i += 4)
        for (let j = 0; j < grid.nz - 1; j++) {
          const a = (j * grid.nx + i) * 3,
            b = a + grid.nx * 3;
          wire.push(pos[a], pos[a + 1], pos[a + 2], pos[b], pos[b + 1], pos[b + 2]);
        }
      const wireGeo = new THREE.BufferGeometry();
      wireGeo.setAttribute("position", new THREE.Float32BufferAttribute(wire, 3));
      const wireMat = new THREE.LineBasicMaterial({ color: pal.ink, transparent: true, opacity: 0.22 });
      const wireLines = new THREE.LineSegments(wireGeo, wireMat);
      wireLines.renderOrder = 2;
      scene.add(wireLines);

      // the ridge, dashed, and the hockey stick at expiry
      const ridgePts: InstanceType<Three["Vector3"]>[] = [];
      for (let j = 0; j <= 60; j++) {
        const days = (D_MAX * j) / 60;
        ridgePts.push(new THREE.Vector3(toX(ROW.K), toY(days <= 0 ? 0 : price(ROW.K, days)) + 0.004, toZ(days)));
      }
      const ridgeGeo = new THREE.BufferGeometry().setFromPoints(ridgePts);
      const ridgeMat = new THREE.LineDashedMaterial({ color: pal.ink, dashSize: 0.05, gapSize: 0.035 });
      const ridge = new THREE.Line(ridgeGeo, ridgeMat);
      ridge.computeLineDistances();
      ridge.renderOrder = 3;
      scene.add(ridge);
      const stickPts = [new THREE.Vector3(toX(F_MIN), 0.003, toZ(0)), new THREE.Vector3(toX(ROW.K), 0.003, toZ(0)), new THREE.Vector3(toX(F_MAX), toY(F_MAX - ROW.K) + 0.003, toZ(0))];
      const stickMat = new THREE.LineBasicMaterial({ color: pal.ink });
      const stick = new THREE.Line(new THREE.BufferGeometry().setFromPoints(stickPts), stickMat);
      scene.add(stick);

      // the box: floor grid, back wall (expiry) with price rungs, left wall with price rungs
      const seg: number[] = [];
      const add = (a: [number, number, number], b: [number, number, number]) => seg.push(...a, ...b);
      const YTOP = toY(900);
      for (const F of [22000, 22200, 22400, 22600, 22800, 23000, 23200]) {
        add([toX(F), 0, toZ(0)], [toX(F), 0, toZ(D_MAX)]);
        add([toX(F), 0, toZ(0)], [toX(F), YTOP, toZ(0)]);
      }
      for (const d of [0, 2, 4, 6, 8, 10, 11]) {
        add([toX(F_MIN), 0, toZ(d)], [toX(F_MAX), 0, toZ(d)]);
        add([toX(F_MIN), 0, toZ(d)], [toX(F_MIN), YTOP, toZ(d)]);
      }
      for (const V of [200, 400, 600, 800]) {
        add([toX(F_MIN), toY(V), toZ(0)], [toX(F_MAX), toY(V), toZ(0)]);
        add([toX(F_MIN), toY(V), toZ(0)], [toX(F_MIN), toY(V), toZ(D_MAX)]);
      }
      const boxGeo = new THREE.BufferGeometry();
      boxGeo.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
      const floorMat = new THREE.LineBasicMaterial({ color: pal.ink3, transparent: true, opacity: 0.28 });
      const floor = new THREE.LineSegments(boxGeo, floorMat);
      scene.add(floor);
      const edgeMat = new THREE.LineBasicMaterial({ color: pal.ink3, transparent: true, opacity: 0.8 });
      const edgePts = [
        new THREE.Vector3(toX(F_MAX), 0, toZ(D_MAX)),
        new THREE.Vector3(toX(F_MIN), 0, toZ(D_MAX)),
        new THREE.Vector3(toX(F_MIN), 0, toZ(0)),
        new THREE.Vector3(toX(F_MAX), 0, toZ(0)),
        new THREE.Vector3(toX(F_MAX), YTOP, toZ(0)),
        new THREE.Vector3(toX(F_MIN), YTOP, toZ(0)),
        new THREE.Vector3(toX(F_MIN), 0, toZ(0)),
      ];
      const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(edgePts), edgeMat);
      scene.add(edge);

      // --- the probe: a bead, a drop line, the slice line and a short tangent ---
      const beadMat = new THREE.MeshStandardMaterial({ color: pal.error, roughness: 0.4 });
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.028, 20, 14), beadMat);
      bead.renderOrder = 6;
      scene.add(bead);
      const dropMat = new THREE.LineBasicMaterial({ color: pal.error, transparent: true, opacity: 0.6 });
      const dropGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      scene.add(new THREE.Line(dropGeo, dropMat));
      const sliceMat = new THREE.LineBasicMaterial({ color: pal.ink, linewidth: 2 });
      const sliceGeo = new THREE.BufferGeometry();
      sliceGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(61 * 3), 3));
      const slice = new THREE.Line(sliceGeo, sliceMat);
      slice.renderOrder = 4;
      scene.add(slice);
      const tanMat = new THREE.LineBasicMaterial({ color: pal.error });
      const tanGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const tangent = new THREE.Line(tanGeo, tanMat);
      tangent.renderOrder = 5;
      scene.add(tangent);

      let side = false;
      const setProbeGeometry = (p: Probe) => {
        const V = price(p.F, p.days);
        const x = toX(p.F),
          y = toY(V),
          z = toZ(p.days);
        bead.position.set(x, y + 0.01, z);
        const dp = dropGeo.attributes.position as InstanceType<Three["BufferAttribute"]>;
        dp.setXYZ(0, x, 0, z);
        dp.setXYZ(1, x, y, z);
        dp.needsUpdate = true;
        const sp = sliceGeo.attributes.position as InstanceType<Three["BufferAttribute"]>;
        if (!side) {
          for (let k = 0; k <= 60; k++) {
            const F = F_MIN + ((F_MAX - F_MIN) * k) / 60;
            sp.setXYZ(k, toX(F), toY(price(F, p.days)) + 0.004, z);
          }
        } else {
          for (let k = 0; k <= 60; k++) {
            const d = (D_MAX * k) / 60;
            sp.setXYZ(k, x, toY(d <= 0 ? Math.max(p.F - ROW.K, 0) : price(p.F, d)) + 0.004, toZ(d));
          }
        }
        sp.needsUpdate = true;
        sliceGeo.computeBoundingSphere();
        const tp = tanGeo.attributes.position as InstanceType<Three["BufferAttribute"]>;
        if (!side) {
          const h = 140;
          const slope = (price(p.F + 1, p.days) - price(p.F - 1, p.days)) / 2;
          tp.setXYZ(0, toX(p.F - h), toY(V - slope * h) + 0.006, z);
          tp.setXYZ(1, toX(p.F + h), toY(V + slope * h) + 0.006, z);
        } else {
          const h = Math.min(1.2, p.days - 0.05, D_MAX - p.days);
          const slope = (price(p.F, p.days + 0.01) - price(p.F, p.days - 0.01)) / 0.02;
          tp.setXYZ(0, x, toY(V - slope * h) + 0.006, toZ(p.days - h));
          tp.setXYZ(1, x, toY(V + slope * h) + 0.006, toZ(p.days + h));
        }
        tp.needsUpdate = true;
        tanGeo.computeBoundingSphere();
      };

      // --- HTML labels projected from scene points ---
      const labelDefs: LabelDef[] = [
        { text: "22,000", at: [toX(22000), 0, toZ(D_MAX) + 0.1] },
        { text: "22,600", at: [toX(22600), 0, toZ(D_MAX) + 0.1] },
        { text: "23,000", at: [toX(23000), 0, toZ(D_MAX) + 0.1] },
        { text: "index →", at: [toX(F_MAX) + 0.02, 0, toZ(D_MAX) + 0.1], cls: "ax" },
        { text: "11 d", at: [toX(F_MAX) + 0.1, 0, toZ(11)] },
        { text: "5 d", at: [toX(F_MAX) + 0.1, 0, toZ(5)] },
        { text: "expiry", at: [toX(F_MAX) + 0.1, 0, toZ(0)] },
        { text: "days left", at: [toX(F_MAX) + 0.12, 0.09, toZ(5.5)], cls: "ax" },
        { text: "price", at: [toX(F_MIN) - 0.16, toY(900), toZ(0)], cls: "ax" },
        { text: "400", at: [toX(F_MIN) - 0.12, toY(400), toZ(0)] },
        { text: "800", at: [toX(F_MIN) - 0.12, toY(800), toZ(0)] },
        { text: "ridge 22,600", at: [toX(ROW.K) - 0.02, toY(price(ROW.K, 6)) + 0.1, toZ(6)], cls: "ridge" },
      ];
      const labelEls = labelDefs.map((d) => {
        const s = document.createElement("span");
        s.className = "c4-gl-label " + (d.cls ?? "");
        s.textContent = d.text;
        el.appendChild(s);
        return s;
      });
      const v3 = new THREE.Vector3();
      const placeLabels = () => {
        const w = el.clientWidth,
          h = el.clientHeight;
        labelDefs.forEach((d, k) => {
          v3.set(d.at[0], d.at[1], d.at[2]).project(camera);
          const sx = ((v3.x + 1) / 2) * w,
            sy = ((1 - v3.y) / 2) * h;
          labelEls[k].style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
          labelEls[k].style.opacity = v3.z < 1 ? "1" : "0";
        });
      };

      // --- render on demand ---
      let raf = 0;
      let pending = false;
      const render = () => {
        pending = false;
        placeCamera();
        renderer.render(scene, camera);
        placeLabels();
      };
      const request = () => {
        if (pending) return;
        pending = true;
        raf = requestAnimationFrame(render);
      };
      const resize = () => {
        const w = Math.max(200, el.clientWidth);
        const hgt = el.clientHeight || height;
        renderer.setSize(w, hgt, false);
        renderer.domElement.style.width = w + "px";
        renderer.domElement.style.height = hgt + "px";
        camera.aspect = w / hgt;
        camera.updateProjectionMatrix();
        request();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      // --- camera swing ---
      let swing = 0;
      const setCamera = (toSide: boolean) => {
        side = toSide;
        setProbeGeometry(probeRef.current);
        const from = { ...cam };
        const to = toSide ? CAM.side : CAM.front;
        const t0 = performance.now();
        cancelAnimationFrame(swing);
        const step = (now: number) => {
          const u = Math.min(1, (now - t0) / 750);
          const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          cam.az = from.az + (to.az - from.az) * e;
          cam.el = from.el + (to.el - from.el) * e;
          cam.r = from.r + (to.r - from.r) * e;
          render();
          if (u < 1) swing = requestAnimationFrame(step);
        };
        swing = requestAnimationFrame(step);
      };

      // --- pointer: raycast on the mesh ---
      const ray = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      let down = false;
      const pick = (ev: PointerEvent) => {
        const r = renderer.domElement.getBoundingClientRect();
        ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -(((ev.clientY - r.top) / r.height) * 2 - 1));
        ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObject(mesh, false)[0];
        if (!hit) return;
        onProbeRef.current({ F: snapF(fromX(hit.point.x)), days: snapD(fromZ(hit.point.z)) });
      };
      const onDown = (ev: PointerEvent) => {
        down = true;
        renderer.domElement.setPointerCapture(ev.pointerId);
        pick(ev);
        ev.preventDefault();
      };
      const onMove = (ev: PointerEvent) => {
        if (down) pick(ev);
      };
      const onUp = () => {
        down = false;
      };
      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointermove", onMove);
      renderer.domElement.addEventListener("pointerup", onUp);
      renderer.domElement.addEventListener("pointercancel", onUp);

      // --- theme changes recolour the materials ---
      const recolour = () => {
        pal = readPalette();
        paint();
        wireMat.color.set(pal.ink);
        ridgeMat.color.set(pal.ink);
        stickMat.color.set(pal.ink);
        sliceMat.color.set(pal.ink);
        floorMat.color.set(pal.ink3);
        edgeMat.color.set(pal.ink3);
        beadMat.color.set(pal.error);
        dropMat.color.set(pal.error);
        tanMat.color.set(pal.error);
        request();
      };
      const mo = new MutationObserver(recolour);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", recolour);

      api.current = {
        setProbe: (p) => {
          setProbeGeometry(p);
          request();
        },
        setCamera,
      };
      setProbeGeometry(probeRef.current);
      if (alongTime) {
        side = true;
        Object.assign(cam, CAM.side);
        setProbeGeometry(probeRef.current);
      }
      request();

      cleanup = () => {
        cancelAnimationFrame(raf);
        cancelAnimationFrame(swing);
        ro.disconnect();
        mo.disconnect();
        mq.removeEventListener("change", recolour);
        renderer.domElement.removeEventListener("pointerdown", onDown);
        renderer.domElement.removeEventListener("pointermove", onMove);
        renderer.domElement.removeEventListener("pointerup", onUp);
        renderer.domElement.removeEventListener("pointercancel", onUp);
        for (const g of [geo, wireGeo, ridgeGeo, dropGeo, sliceGeo, tanGeo]) g.dispose();
        stick.geometry.dispose();
        floor.geometry.dispose();
        edge.geometry.dispose();
        bead.geometry.dispose();
        for (const m of [mat, wireMat, ridgeMat, stickMat, floorMat, edgeMat, beadMat, dropMat, sliceMat, tanMat]) m.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        labelEls.forEach((s) => s.remove());
        api.current = null;
      };
    })().catch((e) => console.error("surface", e));
    return () => {
      dead = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.current?.setProbe(probe);
  }, [probe.F, probe.days]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    api.current?.setCamera(alongTime);
  }, [alongTime]);

  const onKey = (e: React.KeyboardEvent) => {
    const m = e.shiftKey ? 4 : 1;
    let { F, days } = probe;
    if (e.key === "ArrowLeft") F -= 25 * m;
    else if (e.key === "ArrowRight") F += 25 * m;
    else if (e.key === "ArrowUp") days -= 0.5 * m;
    else if (e.key === "ArrowDown") days += 0.5 * m;
    else return;
    e.preventDefault();
    onProbe({ F: snapF(clampF(F)), days: snapD(clampD(days)) });
  };

  return <div ref={box} className="c4-gl-box" style={{ height }} tabIndex={0} onKeyDown={onKey} aria-label="price surface; arrow keys move the probe" />;
}
