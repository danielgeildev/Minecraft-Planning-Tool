const COLORS = [
  '#f472b6', '#fb7185', '#fbbf24', '#34d399',
  '#60a5fa', '#a78bfa', '#f9a8d4', '#86efac', '#fde68a',
]

type Shape = 'rect' | 'circle' | 'star'

interface Particle {
  x: number; y: number
  vx: number; vy: number
  color: string
  rotation: number; rotationSpeed: number
  w: number; h: number
  alpha: number
  shape: Shape
  wobble: number; wobbleSpeed: number
}

export function triggerConfetti(originX?: number, originY?: number, count = 90) {
  if (typeof window === 'undefined') return

  const canvas  = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;z-index:99998;pointer-events:none;'
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')!
  const cx  = originX ?? canvas.width  / 2
  const cy  = originY ?? canvas.height * 0.4

  const particles: Particle[] = Array.from({ length: count }, (_, i) => {
    // Fan upward with some spread to the sides
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4
    const speed = 5 + Math.random() * 10
    const shapes: Shape[] = ['rect', 'rect', 'circle', 'star']
    return {
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: COLORS[i % COLORS.length],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.25,
      w: 7 + Math.random() * 8,
      h: 4 + Math.random() * 5,
      alpha: 1,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.08 + Math.random() * 0.06,
    }
  })

  const GRAVITY  = 0.28
  const DRAG     = 0.992
  const LIFETIME = 130
  let   frame    = 0

  function drawStar(ctx: CanvasRenderingContext2D, r: number) {
    const spikes = 4
    const inner  = r * 0.4
    ctx.beginPath()
    for (let i = 0; i < spikes * 2; i++) {
      const rad   = i % 2 === 0 ? r : inner
      const angle = (i * Math.PI) / spikes
      i === 0 ? ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
              : ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
    }
    ctx.closePath()
    ctx.fill()
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    frame++
    const progress = frame / LIFETIME

    for (const p of particles) {
      p.vy += GRAVITY
      p.vx *= DRAG
      p.vy *= DRAG
      p.wobble += p.wobbleSpeed
      p.x += p.vx + Math.sin(p.wobble) * 0.8
      p.y += p.vy
      p.rotation += p.rotationSpeed
      p.alpha = Math.max(0, 1 - progress * progress)

      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color

      if (p.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.shape === 'star') {
        drawStar(ctx, p.w / 2)
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      }
      ctx.restore()
    }

    if (frame < LIFETIME) requestAnimationFrame(animate)
    else canvas.remove()
  }

  requestAnimationFrame(animate)
}
