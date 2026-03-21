import { useEffect, useRef } from 'react';

interface Building {
  x: number;
  width: number;
  maxHeight: number;
  currentHeight: number;
  riseSpeed: number;
  riseDelay: number;
  windows: Window[];
  roofType: 'flat' | 'pointed' | 'antenna' | 'stepped';
  builtDone: boolean;
}

interface Window {
  relX: number;
  relY: number;
  w: number;
  h: number;
  lit: boolean;
  litDelay: number;
  brightness: number;
  flickerPhase: number;
}

interface DataPulse {
  fromBuilding: number;
  toBuilding: number;
  progress: number;
  speed: number;
  arcHeight: number;
}

const BUILDING_COUNT = 22;
const GLOW_BLUE = [59, 130, 246];
const GLOW_CYAN = [14, 165, 233];

function generateBuildings(w: number, h: number): Building[] {
  const buildings: Building[] = [];
  const baseY = h;
  const minWidth = w / (BUILDING_COUNT * 1.3);
  const maxWidth = w / (BUILDING_COUNT * 0.6);
  let currentX = -20;

  for (let i = 0; i < BUILDING_COUNT; i++) {
    const bWidth = minWidth + Math.random() * (maxWidth - minWidth);
    const bHeight = h * (0.2 + Math.random() * 0.45);
    const roofTypes: Building['roofType'][] = ['flat', 'pointed', 'antenna', 'stepped'];
    const roofType = roofTypes[Math.floor(Math.random() * roofTypes.length)];

    // Generate windows for this building
    const windows: Window[] = [];
    const cols = Math.max(1, Math.floor(bWidth / 16));
    const rows = Math.max(2, Math.floor(bHeight / 22));
    const winW = 6;
    const winH = 9;
    const padX = (bWidth - cols * (winW + 6)) / 2 + 3;
    const padY = 14;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        windows.push({
          relX: padX + col * (winW + 6),
          relY: padY + row * (winH + 8),
          w: winW,
          h: winH,
          lit: Math.random() > 0.3,
          litDelay: 0.8 + Math.random() * 2.5 + i * 0.08,
          brightness: 0,
          flickerPhase: Math.random() * Math.PI * 2,
        });
      }
    }

    buildings.push({
      x: currentX,
      width: bWidth,
      maxHeight: bHeight,
      currentHeight: 0,
      riseSpeed: bHeight / (40 + Math.random() * 30),
      riseDelay: i * 0.06 + Math.random() * 0.3,
      windows,
      roofType,
      builtDone: false,
    });

    currentX += bWidth + (Math.random() * 4 - 1);
  }

  // Center the skyline
  const totalWidth = currentX;
  const offset = (w - totalWidth) / 2;
  for (const b of buildings) {
    b.x += offset;
  }

  return buildings;
}

export default function CitySkyline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const buildingsRef = useRef<Building[]>([]);
  const pulsesRef = useRef<DataPulse[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      const rect = canvas!.getBoundingClientRect();
      buildingsRef.current = generateBuildings(rect.width, rect.height);
      pulsesRef.current = [];
      startTimeRef.current = performance.now();
    }

    resize();
    init();

    const handleResize = () => {
      resize();
      init();
    };
    window.addEventListener('resize', handleResize);

    function drawBuilding(b: Building, baseY: number, time: number) {
      if (b.currentHeight <= 0) return;

      const bx = b.x;
      const by = baseY - b.currentHeight;

      // Building body — dark with subtle blue tint
      const bodyGrad = ctx!.createLinearGradient(bx, by, bx, baseY);
      bodyGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      bodyGrad.addColorStop(1, 'rgba(30, 41, 59, 0.9)');
      ctx!.fillStyle = bodyGrad;
      ctx!.fillRect(bx, by, b.width, b.currentHeight);

      // Building edge glow
      ctx!.strokeStyle = `rgba(${GLOW_BLUE.join(',')}, 0.12)`;
      ctx!.lineWidth = 1;
      ctx!.strokeRect(bx, by, b.width, b.currentHeight);

      // Top edge highlight
      ctx!.strokeStyle = `rgba(${GLOW_CYAN.join(',')}, 0.25)`;
      ctx!.lineWidth = 1.5;
      ctx!.beginPath();
      ctx!.moveTo(bx, by);
      ctx!.lineTo(bx + b.width, by);
      ctx!.stroke();

      // Roof details (only when fully built)
      if (b.builtDone) {
        const cx = bx + b.width / 2;
        ctx!.strokeStyle = `rgba(${GLOW_CYAN.join(',')}, 0.3)`;
        ctx!.lineWidth = 1;

        if (b.roofType === 'pointed') {
          ctx!.beginPath();
          ctx!.moveTo(cx - b.width * 0.3, by);
          ctx!.lineTo(cx, by - 12);
          ctx!.lineTo(cx + b.width * 0.3, by);
          ctx!.stroke();
        } else if (b.roofType === 'antenna') {
          ctx!.beginPath();
          ctx!.moveTo(cx, by);
          ctx!.lineTo(cx, by - 18);
          ctx!.stroke();
          // Blinking light at top
          const blink = Math.sin(time * 3 + b.x) > 0.3;
          if (blink) {
            ctx!.fillStyle = `rgba(239, 68, 68, 0.9)`;
            ctx!.beginPath();
            ctx!.arc(cx, by - 18, 2, 0, Math.PI * 2);
            ctx!.fill();
          }
        } else if (b.roofType === 'stepped') {
          const stepH = 6;
          const stepW = b.width * 0.3;
          ctx!.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx!.fillRect(cx - stepW / 2, by - stepH, stepW, stepH);
          ctx!.strokeStyle = `rgba(${GLOW_CYAN.join(',')}, 0.2)`;
          ctx!.strokeRect(cx - stepW / 2, by - stepH, stepW, stepH);
        }
      }

      // Windows
      const buildProgress = b.currentHeight / b.maxHeight;
      for (const win of b.windows) {
        // Only show windows within the currently built portion
        if (win.relY > b.currentHeight - 10) continue;

        const wx = bx + win.relX;
        const wy = baseY - b.currentHeight + win.relY;

        if (win.lit && win.brightness > 0) {
          const flicker = 0.85 + Math.sin(time * 1.5 + win.flickerPhase) * 0.15;
          const alpha = win.brightness * flicker;

          // Window glow
          const glowGrad = ctx!.createRadialGradient(
            wx + win.w / 2, wy + win.h / 2, 0,
            wx + win.w / 2, wy + win.h / 2, 14
          );
          glowGrad.addColorStop(0, `rgba(${GLOW_CYAN.join(',')}, ${alpha * 0.3})`);
          glowGrad.addColorStop(1, `rgba(${GLOW_CYAN.join(',')}, 0)`);
          ctx!.fillStyle = glowGrad;
          ctx!.fillRect(wx - 6, wy - 4, win.w + 12, win.h + 8);

          // Window fill
          const warmOrCool = Math.random() > 0.5;
          if (warmOrCool) {
            ctx!.fillStyle = `rgba(186, 230, 253, ${alpha * 0.8})`;
          } else {
            ctx!.fillStyle = `rgba(147, 197, 253, ${alpha * 0.7})`;
          }
          ctx!.fillRect(wx, wy, win.w, win.h);
        } else {
          // Unlit window
          ctx!.fillStyle = 'rgba(30, 41, 59, 0.6)';
          ctx!.fillRect(wx, wy, win.w, win.h);
        }
      }
    }

    function drawDataPulse(pulse: DataPulse, buildings: Building[], baseY: number) {
      const from = buildings[pulse.fromBuilding];
      const to = buildings[pulse.toBuilding];
      if (!from.builtDone || !to.builtDone) return;

      const fx = from.x + from.width / 2;
      const fy = baseY - from.currentHeight;
      const tx = to.x + to.width / 2;
      const ty = baseY - to.currentHeight;

      // Arc path
      const t = pulse.progress;
      const mx = fx + (tx - fx) * t;
      const my = fy + (ty - fy) * t - Math.sin(t * Math.PI) * pulse.arcHeight;

      // Pulse glow
      const grad = ctx!.createRadialGradient(mx, my, 0, mx, my, 10);
      grad.addColorStop(0, `rgba(${GLOW_CYAN.join(',')}, 0.9)`);
      grad.addColorStop(0.5, `rgba(${GLOW_BLUE.join(',')}, 0.3)`);
      grad.addColorStop(1, `rgba(${GLOW_CYAN.join(',')}, 0)`);
      ctx!.fillStyle = grad;
      ctx!.beginPath();
      ctx!.arc(mx, my, 10, 0, Math.PI * 2);
      ctx!.fill();

      // Small bright core
      ctx!.fillStyle = `rgba(255, 255, 255, 0.8)`;
      ctx!.beginPath();
      ctx!.arc(mx, my, 2, 0, Math.PI * 2);
      ctx!.fill();

      // Draw faint arc trail
      ctx!.strokeStyle = `rgba(${GLOW_CYAN.join(',')}, 0.08)`;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      for (let s = 0; s <= 20; s++) {
        const st = s / 20;
        const sx = fx + (tx - fx) * st;
        const sy = fy + (ty - fy) * st - Math.sin(st * Math.PI) * pulse.arcHeight;
        if (s === 0) ctx!.moveTo(sx, sy);
        else ctx!.lineTo(sx, sy);
      }
      ctx!.stroke();
    }

    function animate() {
      const rect = canvas!.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const baseY = h;
      ctx!.clearRect(0, 0, w, h);

      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const buildings = buildingsRef.current;
      const pulses = pulsesRef.current;

      // Update buildings — rise animation
      let allBuilt = true;
      for (const b of buildings) {
        if (elapsed < b.riseDelay) {
          allBuilt = false;
          continue;
        }
        if (b.currentHeight < b.maxHeight) {
          b.currentHeight = Math.min(b.maxHeight, b.currentHeight + b.riseSpeed);
          allBuilt = false;
        } else {
          b.builtDone = true;
        }
      }

      // Update window brightness
      for (const b of buildings) {
        for (const win of b.windows) {
          if (win.lit && elapsed > win.litDelay && win.brightness < 1) {
            win.brightness = Math.min(1, win.brightness + 0.03);
          }
        }
      }

      // Ground reflection glow
      const groundGlow = ctx!.createLinearGradient(0, baseY - 30, 0, baseY);
      groundGlow.addColorStop(0, 'rgba(14, 165, 233, 0)');
      groundGlow.addColorStop(1, 'rgba(14, 165, 233, 0.03)');
      ctx!.fillStyle = groundGlow;
      ctx!.fillRect(0, baseY - 30, w, 30);

      // Draw buildings
      for (const b of buildings) {
        drawBuilding(b, baseY, elapsed);
      }

      // Spawn data pulses between random built buildings
      const builtIndices = buildings.map((b, i) => b.builtDone ? i : -1).filter(i => i >= 0);
      if (builtIndices.length > 2 && Math.random() < 0.02) {
        const fi = builtIndices[Math.floor(Math.random() * builtIndices.length)];
        let ti = fi;
        while (ti === fi) ti = builtIndices[Math.floor(Math.random() * builtIndices.length)];
        pulses.push({
          fromBuilding: fi,
          toBuilding: ti,
          progress: 0,
          speed: 0.006 + Math.random() * 0.01,
          arcHeight: 30 + Math.random() * 60,
        });
      }

      // Update and draw pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].progress += pulses[i].speed;
        if (pulses[i].progress > 1) {
          pulses.splice(i, 1);
          continue;
        }
        drawDataPulse(pulses[i], buildings, baseY);
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}
