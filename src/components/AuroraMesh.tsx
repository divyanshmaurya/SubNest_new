import { useEffect, useRef } from 'react';

interface Blob {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: [number, number, number];
  phase: number;
  phaseSpeed: number;
}

const BLOB_CONFIGS: { color: [number, number, number]; radius: number }[] = [
  { color: [37, 99, 235], radius: 350 },   // brand blue
  { color: [14, 165, 233], radius: 300 },   // cyan
  { color: [99, 102, 241], radius: 280 },   // indigo
  { color: [37, 99, 235], radius: 320 },   // blue again
  { color: [6, 182, 212], radius: 260 },    // teal-cyan
  { color: [79, 70, 229], radius: 290 },    // violet-indigo
];

export default function AuroraMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const blobsRef = useRef<Blob[]>([]);

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

    function initBlobs() {
      const rect = canvas!.getBoundingClientRect();
      blobsRef.current = BLOB_CONFIGS.map((cfg, i) => ({
        x: rect.width * (0.15 + Math.random() * 0.7),
        y: rect.height * (0.15 + Math.random() * 0.7),
        radius: cfg.radius + Math.random() * 80,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        color: cfg.color,
        phase: (i / BLOB_CONFIGS.length) * Math.PI * 2,
        phaseSpeed: 0.003 + Math.random() * 0.004,
      }));
    }

    resize();
    initBlobs();

    const handleResize = () => {
      resize();
      initBlobs();
    };
    window.addEventListener('resize', handleResize);

    function animate() {
      const rect = canvas!.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Fade trail for smooth movement
      ctx!.fillStyle = 'rgba(15, 23, 42, 0.12)';
      ctx!.fillRect(0, 0, w, h);

      const blobs = blobsRef.current;

      for (const blob of blobs) {
        // Organic movement using sine waves
        blob.phase += blob.phaseSpeed;
        blob.x += blob.vx + Math.sin(blob.phase) * 0.4;
        blob.y += blob.vy + Math.cos(blob.phase * 0.7) * 0.3;

        // Soft bounce off edges
        if (blob.x < -blob.radius * 0.5) blob.vx = Math.abs(blob.vx);
        if (blob.x > w + blob.radius * 0.5) blob.vx = -Math.abs(blob.vx);
        if (blob.y < -blob.radius * 0.5) blob.vy = Math.abs(blob.vy);
        if (blob.y > h + blob.radius * 0.5) blob.vy = -Math.abs(blob.vy);

        // Pulsing radius
        const pulsingRadius = blob.radius + Math.sin(blob.phase * 1.3) * 30;

        // Draw blob with radial gradient
        const gradient = ctx!.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, pulsingRadius
        );

        const [r, g, b] = blob.color;
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`);
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.12)`);
        gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.04)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx!.fillStyle = gradient;
        ctx!.beginPath();
        ctx!.arc(blob.x, blob.y, pulsingRadius, 0, Math.PI * 2);
        ctx!.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    // Clear canvas fully first
    ctx.fillStyle = 'rgba(15, 23, 42, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
      style={{ opacity: 0.8, filter: 'blur(60px)' }}
    />
  );
}
