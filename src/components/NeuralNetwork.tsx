import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
}

interface Pulse {
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
}

const NODE_COUNT = 60;
const CONNECTION_DISTANCE = 180;
const PULSE_CHANCE = 0.003;
const NODE_COLOR = 'rgba(59, 130, 246, 0.7)';
const NODE_GLOW_COLOR = 'rgba(14, 165, 233, 0.4)';
const LINE_COLOR_BASE = [59, 130, 246];
const PULSE_COLOR = [14, 165, 233];

export default function NeuralNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

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

    function initNodes() {
      const rect = canvas!.getBoundingClientRect();
      const nodes: Node[] = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.5 + 1,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
      nodesRef.current = nodes;
    }

    resize();
    initNodes();

    const handleResize = () => {
      resize();
      initNodes();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseLeave = () => {
      mouseRef.current = null;
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    let time = 0;

    function animate() {
      const rect = canvas!.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx!.clearRect(0, 0, w, h);
      time += 0.016;

      const nodes = nodesRef.current;
      const pulses = pulsesRef.current;
      const mouse = mouseRef.current;

      // Update node positions
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges with padding
        if (node.x < 0 || node.x > w) node.vx *= -1;
        if (node.y < 0 || node.y > h) node.vy *= -1;
        node.x = Math.max(0, Math.min(w, node.x));
        node.y = Math.max(0, Math.min(h, node.y));

        // Gentle mouse repulsion
        if (mouse) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120 * 0.3;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }

        // Dampen velocity
        node.vx *= 0.999;
        node.vy *= 0.999;
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.15;
            ctx!.strokeStyle = `rgba(${LINE_COLOR_BASE.join(',')}, ${opacity})`;
            ctx!.lineWidth = 0.5;
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.stroke();

            // Randomly spawn pulses
            if (Math.random() < PULSE_CHANCE) {
              pulses.push({
                fromIndex: i,
                toIndex: j,
                progress: 0,
                speed: 0.008 + Math.random() * 0.012,
              });
            }
          }
        }
      }

      // Draw and update pulses
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress > 1) {
          pulses.splice(p, 1);
          continue;
        }

        const from = nodes[pulse.fromIndex];
        const to = nodes[pulse.toIndex];
        const px = from.x + (to.x - from.x) * pulse.progress;
        const py = from.y + (to.y - from.y) * pulse.progress;

        const gradient = ctx!.createRadialGradient(px, py, 0, px, py, 8);
        gradient.addColorStop(0, `rgba(${PULSE_COLOR.join(',')}, 0.8)`);
        gradient.addColorStop(1, `rgba(${PULSE_COLOR.join(',')}, 0)`);
        ctx!.fillStyle = gradient;
        ctx!.beginPath();
        ctx!.arc(px, py, 8, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Draw nodes
      for (const node of nodes) {
        const pulse = Math.sin(time * 2 + node.pulsePhase) * 0.3 + 0.7;

        // Glow
        const glow = ctx!.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 6);
        glow.addColorStop(0, NODE_GLOW_COLOR);
        glow.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, node.radius * 6, 0, Math.PI * 2);
        ctx!.fill();

        // Core dot
        ctx!.fillStyle = NODE_COLOR;
        ctx!.globalAlpha = pulse;
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ opacity: 0.6 }}
    />
  );
}
