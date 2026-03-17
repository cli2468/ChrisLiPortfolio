import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Routes, Route, Link, useLocation, useParams } from 'react-router-dom'
import Lenis from 'lenis'
import underPressureThumb from './assets/WorksThumbnails/UnderPressure.png'
import greenWitchCafeThumb from './assets/WorksThumbnails/GreenWitchCafe.png'
import mrMillerThumb from './assets/WorksThumbnails/MrMiller.png'
import visionThumb from './assets/WorksThumbnails/Vision.png'
import royalTeaThumb from './assets/WorksThumbnails/RoyalTea.png'
import underPressureMobile from './assets/WorksThumbnails/mobile/UnderPressureMobile.png'
import greenWitchCafeMobile from './assets/WorksThumbnails/mobile/GWCMobile.png'
import mrMillerMobile from './assets/WorksThumbnails/mobile/MMDetailingMobile.png'
import visionMobile from './assets/WorksThumbnails/mobile/VisionMobile.png'
import royalTeaMobile from './assets/WorksThumbnails/mobile/RoyalTeaMobile.png'
import './App.css'

/* â”€â”€â”€ Intersection Observer hook for scroll reveals â”€â”€â”€ */
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          obs.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }) {
  const ref = useReveal()
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

/* â”€â”€â”€ Mobile detection hook â”€â”€â”€ */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

/* â”€â”€â”€ Animated text swap (fade only, no movement) â”€â”€â”€ */
function AnimatedText({ text, className = '', tag: Tag = 'span' }) {
  const [displayed, setDisplayed] = useState(text)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (text === displayed) return
    setAnimating(true)
    const t = setTimeout(() => {
      setDisplayed(text)
      setAnimating(false)
    }, 250)
    return () => clearTimeout(t)
  }, [text, displayed])

  return (
    <Tag className={`anim-text ${className} ${animating ? 'anim-text--out' : 'anim-text--in'}`}>
      {displayed}
    </Tag>
  )
}

/* â”€â”€â”€ Mask counter â€” directional slide reveal â”€â”€â”€ */
function MaskCounter({ value, className = '' }) {
  const [displayed, setDisplayed] = useState(value)
  const [direction, setDirection] = useState(1)
  const [animState, setAnimState] = useState('idle')
  const innerRef = useRef(null)

  useEffect(() => {
    if (value === displayed) return
    const dir = parseInt(value, 10) > parseInt(displayed, 10) ? 1 : -1
    setDirection(dir)
    setAnimState('exit')

    const t = setTimeout(() => {
      setDisplayed(value)
      setAnimState('enter')
      const t2 = setTimeout(() => setAnimState('idle'), 250)
      return () => clearTimeout(t2)
    }, 200)
    return () => clearTimeout(t)
  }, [value, displayed])

  // On enter: snap to start position then animate in
  useEffect(() => {
    if (animState === 'enter' && innerRef.current) {
      const el = innerRef.current
      el.style.transition = 'none'
      el.style.transform = `translateY(${direction * 100}%)`
      el.offsetHeight // force reflow
      el.style.transition = 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)'
      el.style.transform = 'translateY(0)'
    }
  }, [animState, direction])

  return (
    <span className={`mask-counter ${className}`}>
      <span
        ref={innerRef}
        className="mask-counter__inner"
        style={animState === 'exit' ? {
          transform: `translateY(${direction * -100}%)`,
          transition: 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)',
        } : undefined}
      >
        {displayed}
      </span>
    </span>
  )
}

/* â”€â”€â”€ Page transition wrapper â”€â”€â”€ */
function PageTransition({ children }) {
  return (
    <div className="page-transition page-enter">
      {children}
    </div>
  )
}

/* â”€â”€â”€ Wavy Dot Grid Hero â€” Marble/Indent Effect â”€â”€â”€ */
function WavyGrid({ containerRef }) {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas.getContext('2d')
    let cols, rows
    const spacing = 28
    const dotRadius = 1.2
    const influenceRadius = 150
    const maxDisplacement = 18

    function resize() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      cols = Math.ceil(canvas.offsetWidth / spacing) + 1
      rows = Math.ceil(canvas.offsetHeight / spacing) + 1
    }

    resize()
    window.addEventListener('resize', resize)

    // Track mouse on the parent section so it works even over the text
    function handleMouse(e) {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    function handleMouseLeave() {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    container.addEventListener('mousemove', handleMouse)
    container.addEventListener('mouseleave', handleMouseLeave)

    let time = 0
    function draw() {
      time += 0.008
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = c * spacing
          const baseY = r * spacing

          const wave = Math.sin(baseX * 0.015 + time) * Math.cos(baseY * 0.015 + time * 0.7) * 3

          let dx = 0
          let dy = 0
          let distortScale = 1

          const diffX = baseX - mx
          const diffY = baseY - my
          const dist = Math.sqrt(diffX * diffX + diffY * diffY)

          if (dist < influenceRadius) {
            const force = (1 - dist / influenceRadius)
            const smoothForce = force * force * (3 - 2 * force) // smoothstep
            const angle = Math.atan2(diffY, diffX)
            // Inward: dots are PULLED TOWARD the mouse (negative direction)
            dx = -Math.cos(angle) * smoothForce * maxDisplacement
            dy = -Math.sin(angle) * smoothForce * maxDisplacement
            // Dots shrink near center to create depth/indent illusion
            distortScale = 1 - smoothForce * 0.6
          }

          const x = baseX + dx
          const y = baseY + wave + dy

          const cx = w / 2
          const cy = h / 2
          const distFromCenter = Math.sqrt((baseX - cx) ** 2 + (baseY - cy) ** 2)
          const maxDist = Math.sqrt(cx * cx + cy * cy)
          const opacity = Math.max(0.08, 1 - (distFromCenter / maxDist) * 0.85)

          ctx.beginPath()
          ctx.arc(x, y, Math.max(0.3, dotRadius * distortScale), 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.4})`
          ctx.fill()
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      container.removeEventListener('mousemove', handleMouse)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [containerRef])

  return <canvas ref={canvasRef} className="wavy-grid" />
}

/* â”€â”€â”€ Typing animation hook â”€â”€â”€ */
function useTypingLoop(words, typingSpeed = 80, deletingSpeed = 40, pauseMs = 2000) {
  const [display, setDisplay] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [phase, setPhase] = useState('typing') // 'typing' | 'pausing' | 'deleting'

  useEffect(() => {
    const currentWord = words[wordIndex]

    if (phase === 'typing') {
      if (charIndex < currentWord.length) {
        const next = charIndex + 1
        const t = setTimeout(() => {
          setDisplay(currentWord.slice(0, next))
          setCharIndex(next)
        }, typingSpeed)
        return () => clearTimeout(t)
      }
      // Finished typing â€” pause
      setPhase('pausing')
      return
    }

    if (phase === 'pausing') {
      const t = setTimeout(() => setPhase('deleting'), pauseMs)
      return () => clearTimeout(t)
    }

    if (phase === 'deleting') {
      if (charIndex > 0) {
        const next = charIndex - 1
        const t = setTimeout(() => {
          setDisplay(currentWord.slice(0, next))
          setCharIndex(next)
        }, deletingSpeed)
        return () => clearTimeout(t)
      }
      // Finished deleting â€” move to next word
      setWordIndex((wordIndex + 1) % words.length)
      setPhase('typing')
      return
    }
  }, [charIndex, phase, wordIndex, words, typingSpeed, deletingSpeed, pauseMs])

  return display
}

/* â”€â”€â”€ Interactive ASCII Donut â”€â”€â”€ */
function AsciiDonut() {
  const isMobile = useIsMobile()
  const preRef = useRef(null)
  const [showHint, setShowHint] = useState(true)
  const stateRef = useRef({
    A: 0, B: 0,            // current rotation angles
    autoA: 0.005, autoB: 0.008, // auto-spin speeds
    velA: 0, velB: 0,       // velocity from drag
    dragging: false,
    lastX: 0, lastY: 0,
  })
  const animRef = useRef(null)

  useEffect(() => {
    const pre = preRef.current
    if (!pre) return

    const cols = 60
    // Mobile gets a taller buffer so the larger donut still has enough
    // headroom and doesn't clip vertically.
    const rows = isMobile ? 53 : 37
    const R1 = 1
    const R2 = 2
    const K2 = 5
    const donutScale = isMobile ? 0.896 : 0.448
    const K1 = cols * K2 * 3 / (8 * (R1 + R2)) * donutScale
    const chars = '.,-~:;=!*#$@'

    function renderFrame() {
      const s = stateRef.current

      // Apply auto-spin + velocity
      if (!s.dragging) {
        s.velA *= 0.95 // friction
        s.velB *= 0.95
        s.A += s.autoA + s.velA
        s.B += s.autoB + s.velB
        // Decay velocity toward zero
        if (Math.abs(s.velA) < 0.0001) s.velA = 0
        if (Math.abs(s.velB) < 0.0001) s.velB = 0
      }

      const cosA = Math.cos(s.A), sinA = Math.sin(s.A)
      const cosB = Math.cos(s.B), sinB = Math.sin(s.B)

      const output = new Array(cols * rows).fill(' ')
      const zbuf = new Array(cols * rows).fill(0)

      for (let theta = 0; theta < 6.28; theta += 0.07) {
        const cosT = Math.cos(theta), sinT = Math.sin(theta)
        for (let phi = 0; phi < 6.28; phi += 0.02) {
          const cosP = Math.cos(phi), sinP = Math.sin(phi)

          const cx = R2 + R1 * cosT
          const cy = R1 * sinT

          const x = cx * (cosB * cosP + sinA * sinB * sinP) - cy * cosA * sinB
          const y = cx * (sinB * cosP - sinA * cosB * sinP) + cy * cosA * cosB
          const z = K2 + cosA * cx * sinP + cy * sinA
          const ooz = 1 / z

          const xp = Math.floor(cols / 2 + K1 * ooz * x)
          const yp = Math.floor(rows / 2 - K1 * ooz * y)

          const L = cosP * cosT * sinB - cosA * cosT * sinP - sinA * sinT + cosB * (cosA * sinT - cosT * sinA * sinP)

          if (xp >= 0 && xp < cols && yp >= 0 && yp < rows) {
            const idx = yp * cols + xp
            if (ooz > zbuf[idx]) {
              zbuf[idx] = ooz
              const li = Math.max(0, Math.floor(L * 8))
              output[idx] = chars[Math.min(li, chars.length - 1)]
            }
          }
        }
      }

      let str = ''
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          str += output[r * cols + c]
        }
        if (r < rows - 1) str += '\n'
      }
      pre.textContent = str

      animRef.current = requestAnimationFrame(renderFrame)
    }

    renderFrame()
    return () => cancelAnimationFrame(animRef.current)
  }, [isMobile])

  // Drag handlers
  const onPointerDown = useCallback((e) => {
    const s = stateRef.current
    setShowHint(false)
    s.dragging = true
    s.lastX = e.clientX
    s.lastY = e.clientY
    s.velA = 0
    s.velB = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e) => {
    const s = stateRef.current
    if (!s.dragging) return
    const dx = e.clientX - s.lastX
    const dy = e.clientY - s.lastY
    s.B += dx * 0.01
    s.A += dy * 0.01
    s.velB = dx * 0.01
    s.velA = dy * 0.01
    s.lastX = e.clientX
    s.lastY = e.clientY
  }, [])

  const onPointerUp = useCallback(() => {
    stateRef.current.dragging = false
  }, [])

  return (
    <div className="ascii-donut">
      <div
        className="ascii-donut__gesture-area"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <pre ref={preRef} className="ascii-donut__pre" />
      </div>
      <span
        className={`ascii-donut__hint${showHint ? '' : ' ascii-donut__hint--hidden'}${isMobile && showHint ? ' ascii-donut__hint--pulse' : ''}`}
      >
        {isMobile ? 'swipe to spin' : 'drag to spin'}
      </span>
    </div>
  )
}

function Hero() {
  const heroRef = useRef(null)
  const typedRole = useTypingLoop([' web designer.', ' developer.', ' early adopter.', ' builder.', ' creative.'], 80, 40, 1800)

  return (
    <section className="hero" ref={heroRef}>
      <WavyGrid containerRef={heroRef} />
      <div className="hero__inner">
        <div className="hero__left">
          <Reveal>
            <h1 className="hero__headline">
              I'm Chris Li
            </h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="hero__typing-line">
              I'm a<span className="hero__typed">{typedRole}</span><span className="hero__cursor" aria-hidden="true">|</span>
            </p>
          </Reveal>
          <Reveal delay={180}>
            <p className="hero__bio">
              I build websites for businesses that deserve to look as good online as they are in person.
            </p>
          </Reveal>
        </div>
        <div className="hero__right">
          <div className="hero__interactive-space">
            <AsciiDonut />
          </div>
        </div>
      </div>
    </section>
  )
}

/* â”€â”€â”€ Navbar â”€â”€â”€ */
function Navbar() {
  const location = useLocation()
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <nav className="nav-pill">
        <div className="nav-pill__inner">
          <a href="#hero" className="nav-logo">C.</a>
          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#work">Work</a>
            <a href="#contact" className="nav-cta">
              <span>Let's Talk</span>
              <span className="nav-cta__arrow">&rarr;</span>
            </a>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="nav-pill">
      <div className="nav-pill__inner">
        <Link to="/" className="nav-logo">C.</Link>
        <div className="nav-links">
          <Link to="/work" className={location.pathname === '/work' ? 'active' : ''}>Work</Link>
          <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link>
          <Link to="/contact" className="nav-cta">
            <span>Let's Talk</span>
            <span className="nav-cta__arrow">&rarr;</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* â”€â”€â”€ About / Motivation (home page) â”€â”€â”€ */
function AboutBrief() {
  return (
    <section id="about" className="motivation">
      <div className="motivation__inner">
        <div className="motivation__left">
          <Reveal>
            <p className="motivation__body">
              I've been early to most things I've gotten into - crypto before it blew up, beta tester for GPT before ChatGPT went public, e-commerce before I could legally sign a lease. Taught myself all of it off YouTube and the internet, turned a reselling operation into $300K in revenue, and paid for my own college along the way. Now I build websites. Whatever I'm doing next year might be different, but the way I get there won't be - I find things early, learn them fast, and make something real with them.
            </p>
          </Reveal>
        </div>
        <div className="motivation__right">
          <Reveal delay={150}>
            <div className="motivation__image-placeholder">
              <span>Photo</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* â”€â”€â”€ Sticky Scroll Works Section â”€â”€â”€ */
const projects = [
  {
    slug: 'under-pressure',
    title: 'UNDER PRESSURE EXTERIOR WASHING',
    category: 'Client / Website',
    year: '2026',
    desc: 'A clean, conversion-focused website for a pressure washing business with booking integration and service breakdowns.',
    thumbnail: underPressureThumb,
    mobileThumbnail: underPressureMobile,
    thumbnailPosition: '52% 50%',
    detailPosition: '52% 50%',
    url: 'https://cli2468.github.io/UnderPressureLLC/',
  },
  {
    slug: 'green-witch-cafe',
    title: 'GREEN WITCH CAFE',
    category: 'Client / Website',
    year: '2026',
    desc: 'A warm, inviting website for a local cafe featuring their menu, story, and online ordering experience.',
    thumbnail: greenWitchCafeThumb,
    mobileThumbnail: greenWitchCafeMobile,
    thumbnailPosition: '56% 50%',
    detailPosition: '56% 50%',
    url: 'https://cli2468.github.io/GreenWitchCafe/',
  },
  {
    slug: 'mr-millers-detailing',
    title: "MR. MILLER'S MOBILE DETAILING",
    category: 'Client / Website',
    year: '2026',
    desc: 'A sleek website for a mobile auto detailing service, designed to drive bookings and showcase their work.',
    thumbnail: mrMillerThumb,
    mobileThumbnail: mrMillerMobile,
    thumbnailPosition: '60% 50%',
    detailPosition: '60% 50%',
    url: 'https://mrmillersmobiledetailing.com/',
  },
  {
    slug: 'vision',
    title: 'VISION',
    category: 'Personal Project / Full Stack',
    year: '2025',
    desc: 'An order parsing and financial database management tool built to streamline my e-commerce reselling operations.',
    thumbnail: visionThumb,
    mobileThumbnail: visionMobile,
    thumbnailPosition: '50% 50%',
    detailPosition: '50% 50%',
    url: 'https://cli2468.github.io/Vision/',
  },
  {
    slug: 'royal-tea',
    title: 'ROYAL TEA',
    category: 'Personal Project / Website',
    year: '2025',
    desc: 'A website built for family, bringing their tea brand to life with a modern, elegant digital presence.',
    thumbnail: royalTeaThumb,
    mobileThumbnail: royalTeaMobile,
    thumbnailPosition: '50% 50%',
    detailPosition: '50% 50%',
    url: 'https://royalteaone.com/',
  },
]

/* â”€â”€â”€ Custom "VIEW" cursor for work cards â”€â”€â”€ */
function ViewCursor() {
  const cursorRef = useRef(null)
  const posRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
  const visibleRef = useRef(false)
  const [visible, setVisible] = useState(false)
  const animRef = useRef(null)

  useEffect(() => {
    function getCardInner(target) {
      return target instanceof Element ? target.closest('.work-scroll__card-inner') : null
    }

    function handleMouseMove(e) {
      posRef.current.targetX = e.clientX
      posRef.current.targetY = e.clientY
    }

    function handleOver(e) {
      if (getCardInner(e.target)) {
        visibleRef.current = true
        setVisible(true)
      }
    }
    function handleOut(e) {
      const fromCard = getCardInner(e.target)
      const toCard = getCardInner(e.relatedTarget)

      if (fromCard && !toCard) {
        visibleRef.current = false
        setVisible(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseover', handleOver)
    document.addEventListener('mouseout', handleOut)

    function tick() {
      const p = posRef.current
      p.x += (p.targetX - p.x) * 0.15
      p.y += (p.targetY - p.y) * 0.15
      if (cursorRef.current) {
        const s = visibleRef.current ? 1 : 0.6
        cursorRef.current.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${s})`
      }
      animRef.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseover', handleOver)
      document.removeEventListener('mouseout', handleOut)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return createPortal(
    <div
      ref={cursorRef}
      className={`view-cursor ${visible ? 'view-cursor--visible' : ''}`}
    >
      VIEW
    </div>,
    document.body
  )
}

function WorkStickyScroll() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobileWorkCarousel />
  }

  return <DesktopWorkStickyScroll />
}

function DesktopWorkStickyScroll() {
  const sectionRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const cards = section.querySelectorAll('.work-scroll__card')

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.index)
            setActiveIndex(idx)
          }
        })
      },
      { root: null, threshold: 0.6 }
    )

    cards.forEach((card) => obs.observe(card))
    return () => obs.disconnect()
  }, [])

  return (
    <section id="work" className="work-scroll" ref={sectionRef}>
      <ViewCursor />
      <div className="work-scroll__container">
        <div className="work-scroll__left">
          {projects.map((project, i) => (
            <div
              key={project.title}
              className={`work-scroll__card ${activeIndex === i ? 'work-scroll__card--active' : ''}`}
              data-index={i}
            >
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="work-scroll__card-link">
                <div className="work-scroll__card-inner">
                  <div className="work-scroll__placeholder">
                    <img
                      src={project.thumbnail}
                      alt={`${project.title} thumbnail`}
                      className="work-scroll__thumbnail"
                      style={{ objectPosition: project.thumbnailPosition }}
                    />
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>

        <div className="work-scroll__right">
          <div className="work-scroll__sticky">
            <div className="work-scroll__header">
              <h2 className="work-scroll__section-title">WORKS</h2>
              <span className="work-scroll__handle">/chris</span>
            </div>
            <div className="work-scroll__divider" />

            <div className="work-scroll__counter">
              [ <MaskCounter value={String(activeIndex + 1).padStart(2, '0')} className="work-scroll__counter-current" />
              <span className="work-scroll__counter-sep"> / </span>
              <span className="work-scroll__counter-total">{String(projects.length).padStart(2, '0')}</span> ]
            </div>

            <AnimatedText text={projects[activeIndex].title} className="work-scroll__title" tag="h3" />
            <AnimatedText text={projects[activeIndex].category} className="work-scroll__category" tag="p" />
            <AnimatedText text={projects[activeIndex].desc} className="work-scroll__desc" tag="p" />
          </div>
        </div>
      </div>
    </section>
  )
}

function MobileWorkCarousel() {
  const trackRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)


  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    function updateActiveCard() {
      const cards = Array.from(track.querySelectorAll('.work-carousel__card'))
      if (!cards.length) return

      const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2
      let nextIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect()
        const cardCenter = rect.left + rect.width / 2
        const distance = Math.abs(cardCenter - trackCenter)

        if (distance < closestDistance) {
          closestDistance = distance
          nextIndex = index
        }
      })

      setActiveIndex(nextIndex)
    }

    let frame = null
    function handleScroll() {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(updateActiveCard)
    }

    updateActiveCard()
    track.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', updateActiveCard)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      track.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateActiveCard)
    }
  }, [])

  const activeProject = projects[activeIndex]

  return (
    <section id="work" className="work-scroll work-scroll--mobile">
      <div className="work-carousel">
        <Reveal className="work-carousel__intro">
          <div className="work-carousel__header">
            <h2 className="work-carousel__section-title">WORKS</h2>
            <span className="work-carousel__handle">/chris</span>
          </div>

          <div className="work-carousel__divider" />

          <div className="work-carousel__counter">
            [ <MaskCounter value={String(activeIndex + 1).padStart(2, '0')} className="work-carousel__counter-current" />
            <span className="work-carousel__counter-sep"> / </span>
            <span className="work-carousel__counter-total">{String(projects.length).padStart(2, '0')}</span> ]
          </div>

          <div key={activeProject.slug} className="work-carousel__meta-swap">
            <h3 className="work-carousel__title">{activeProject.title}</h3>
            <p className="work-carousel__category">{activeProject.category}</p>
            <p className="work-carousel__desc">{activeProject.desc}</p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div ref={trackRef} className="work-carousel__track" aria-label="Project carousel">
            {projects.map((project, index) => (
              <a
                key={project.slug}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`work-carousel__card${activeIndex === index ? ' work-carousel__card--active' : ''}`}
                aria-label={`Visit ${project.title}`}
              >
                <div className="phone-frame">
                  <div className="phone-frame__notch" />
                  <div className="phone-frame__screen">
                    <img
                      src={project.mobileThumbnail}
                      alt={`${project.title} mobile preview`}
                      className="phone-frame__image"
                    />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div className="work-carousel__hint">swipe to browse / tap to visit</div>
        </Reveal>
      </div>

    </section>
  )
}


/* â”€â”€â”€ Contact â”€â”€â”€ */
function Contact() {
  return (
    <section id="contact" className="contact">
      <Reveal>
        <span className="eyebrow">GET IN TOUCH</span>
      </Reveal>
      <Reveal delay={100}>
        <h2 className="contact__heading">
          Got a project?<br />
          Let's make it <span className="text-stamp">unforgettable</span>.
        </h2>
      </Reveal>
      <Reveal delay={200}>
        <a href="mailto:lichristopher2468@gmail.com" className="contact__cta">
          <span>lichristopher2468@gmail.com</span>
          <span className="contact__cta-arrow">
            <span>&rarr;</span>
          </span>
        </a>
      </Reveal>
      <Reveal delay={300}>
        <div className="contact__socials">
          <a href="https://www.linkedin.com/in/chrisjoshli/" target="_blank" rel="noopener noreferrer" className="contact__social-icon" aria-label="LinkedIn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          <a href="https://github.com/chrisjoshli" target="_blank" rel="noopener noreferrer" className="contact__social-icon" aria-label="GitHub">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
          </a>
          <a href="mailto:lichristopher2468@gmail.com" className="contact__social-icon" aria-label="Email">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>
          </a>
        </div>
      </Reveal>
    </section>
  )
}

/* â”€â”€â”€ Footer â”€â”€â”€ */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <span className="footer__logo">C.</span>
        <span className="footer__copy">&copy; 2026 Chris Li. All rights reserved.</span>
      </div>
    </footer>
  )
}

/* â”€â”€â”€ Noise overlay â”€â”€â”€ */
function NoiseOverlay() {
  return <div className="noise-overlay" aria-hidden="true" />
}

/* â”€â”€â”€ Project Detail Page â”€â”€â”€ */
function ProjectDetailPage() {
  const { slug } = useParams()
  const project = projects.find(p => p.slug === slug)
  const projectIndex = projects.findIndex(p => p.slug === slug)

  if (!project) {
    return (
      <section className="project-detail">
        <div className="project-detail__container">
          <h2 className="project-detail__title">Project not found</h2>
          <Link to="/work" className="project-detail__back">Back to Works</Link>
        </div>
      </section>
    )
  }

  const prevProject = projectIndex > 0 ? projects[projectIndex - 1] : null
  const nextProject = projectIndex < projects.length - 1 ? projects[projectIndex + 1] : null

  return (
    <section className="project-detail">
      <div className="project-detail__container">
        <Link to="/work" className="project-detail__back">
          <span className="project-detail__back-arrow">&larr;</span>
          Back to Works
        </Link>

        <div className="project-detail__hero">
          <Reveal>
            <span className="project-detail__eyebrow">{project.category} &middot; {project.year}</span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="project-detail__title">{project.title}</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="project-detail__desc">{project.desc}</p>
          </Reveal>
        </div>

        <Reveal delay={240}>
          <div className="project-detail__media">
            <img
              src={project.thumbnail}
              alt={`${project.title} preview`}
              className="project-detail__media-image"
              style={{ objectPosition: project.detailPosition }}
            />
          </div>
        </Reveal>

        <Reveal delay={300}>
          <div className="project-detail__content">
            <div className="project-detail__info-grid">
              <div className="project-detail__info-item">
                <span className="project-detail__info-label">Role</span>
                <span className="project-detail__info-value">Design & Development</span>
              </div>
              <div className="project-detail__info-item">
                <span className="project-detail__info-label">Year</span>
                <span className="project-detail__info-value">{project.year}</span>
              </div>
              <div className="project-detail__info-item">
                <span className="project-detail__info-label">Type</span>
                <span className="project-detail__info-value">{project.category}</span>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="project-detail__nav">
          {prevProject ? (
            <Link to={`/work/${prevProject.slug}`} className="project-detail__nav-link project-detail__nav-link--prev">
              <span className="project-detail__nav-dir">Previous</span>
              <span className="project-detail__nav-title">{prevProject.title}</span>
            </Link>
          ) : <div />}
          {nextProject ? (
            <Link to={`/work/${nextProject.slug}`} className="project-detail__nav-link project-detail__nav-link--next">
              <span className="project-detail__nav-dir">Next</span>
              <span className="project-detail__nav-title">{nextProject.title}</span>
            </Link>
          ) : <div />}
        </div>
      </div>
    </section>
  )
}

/* â”€â”€â”€ Page: Home â”€â”€â”€ */
function HomePage() {
  return (
    <>
      <Hero />
    </>
  )
}

/* â”€â”€â”€ Page: Work â”€â”€â”€ */
function WorkPage() {
  return <WorkStickyScroll />
}

/* â”€â”€â”€ Page: About â”€â”€â”€ */
function AboutPage() {
  const experienceEntries = [
    {
      company: 'Freelance',
      location: 'Remote',
      role: 'Web Designer & Developer',
      type: 'Self-employed',
      dates: 'Jan 2025 - Present',
      desc: 'Designing and building websites for small businesses and personal brands. Handling everything from client communication and design to development and deployment.',
    },
    {
      company: 'Brother Rental LLC',
      location: 'Hammond, IN',
      role: 'Property Manager',
      type: 'Full-time',
      dates: 'Jun 2025 - Present',
      desc: 'I run two rental units on the side. Finding tenants, collecting rent, coordinating repairs, doing the books and tax filings - all self-managed. Both units full, zero missed payments, and I\'ve brought operating costs down by renegotiating vendors.',
    },
    {
      company: 'U.S. Department of Energy',
      location: 'St John, IN',
      role: 'Data Analytics Intern',
      type: 'Internship',
      dates: 'Sep 2025 - Jan 2026',
      desc: 'Interned at the DOE analyzing whether a city\'s fleet of 800 vehicles should switch to alternative fuels. Built dashboards in Excel to make sense of $35M worth of assets, found about $500K in potential annual savings nobody had flagged, and presented the findings directly to senior leadership.',
    },
    {
      company: 'E-Commerce Businesses',
      location: 'Griffith, IN',
      role: 'Owner',
      type: 'Self-employed',
      dates: 'Sep 2019 - May 2023',
      desc: 'I started flipping random stuff online my freshman year - swimming pools, bikes, whatever moved. Taught myself sourcing, pricing, shipping, customer service, bookkeeping, all from YouTube. Did it for four years, shipped about 2,500 orders, and cleared $300K in revenue. That\'s what paid for school.',
    },
  ]

  const skillCategories = [
    { category: 'Development', items: ['React', 'JavaScript', 'HTML/CSS', 'Tailwind CSS', 'Node.js', 'Git', 'Vite'] },
    { category: 'Analytics & Reporting', items: ['Excel', 'Pivot Tables', 'XLOOKUP', 'Tableau', 'Power BI', 'Dynamic Dashboards'] },
    { category: 'Tools', items: ['Figma', 'QuickBooks', 'Microsoft Office Suite', 'Digital Marketing', 'Facebook Ads'] },
  ]

  return (
    <section className="about">
      <div className="about__container">

        {/* Left â€” Facts + Socials */}
        <div className="about__left">
          <div className="about__left-sticky">
            <Reveal>
              <div className="about__fact">
                <span className="about__fact-label">Hometown</span>
                <span className="about__fact-value">Griffith, IN</span>
              </div>
            </Reveal>
            <Reveal delay={60}>
              <div className="about__fact">
                <span className="about__fact-label">Residence</span>
                <span className="about__fact-value">Northwest Indiana</span>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="about__fact">
                <span className="about__fact-label">University</span>
                <span className="about__fact-value">Indiana University Northwest</span>
              </div>
            </Reveal>
            <Reveal delay={180}>
              <div className="about__fact">
                <span className="about__fact-label">Major</span>
                <span className="about__fact-value">Accounting (BS)</span>
              </div>
            </Reveal>
            <div className="about__socials">
              <Reveal delay={240}>
                <a href="https://www.linkedin.com/in/chrisjoshli/" target="_blank" rel="noopener noreferrer" className="about__social-icon" aria-label="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </Reveal>
              <Reveal delay={280}>
                <a href="https://github.com/chrisjoshli" target="_blank" rel="noopener noreferrer" className="about__social-icon" aria-label="GitHub">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </Reveal>
              <Reveal delay={320}>
                <a href="mailto:lichristopher2468@gmail.com" className="about__social-icon" aria-label="Email">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>
                </a>
              </Reveal>
            </div>
          </div>
        </div>

        {/* Right â€” Editorial intro + Resume */}
        <div className="about__right">

          {/* Editorial intro â€” display font, no pill */}
          <div className="about__intro-block">
            <Reveal>
              <h1 className="about__bio">
                I've been early to most things I've gotten into - crypto before it blew up, beta tester for GPT before ChatGPT went public, e-commerce before I could legally sign a lease. Taught myself all of it off YouTube and the internet, turned a reselling operation into $300K in revenue, and paid for my own college along the way. Now I build websites. Whatever I'm doing next year might be different, but the way I get there won't be - I find things early, learn them fast, and make something real with them.
              </h1>
            </Reveal>
          </div>

          {/* Experience */}
          <div className="about__resume-section">
            <Reveal>
              <h2 className="about__section-heading">Experience</h2>
            </Reveal>
            {experienceEntries.map((entry, i) => (
              <Reveal key={entry.company} delay={i * 80}>
                <div className="about__exp-entry">
                  <div className="about__exp-header">
                    <div className="about__exp-left">
                      <h3 className="about__exp-company">
                        {entry.company}
                        <span className="about__exp-location"> / {entry.location}</span>
                      </h3>
                      <p className="about__exp-role">
                        {entry.role}
                        <span className="about__exp-type"> - {entry.type}</span>
                      </p>
                    </div>
                    <span className="about__exp-dates">{entry.dates}</span>
                  </div>
                  <p className="about__exp-desc">{entry.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Skills */}
          <div className="about__resume-section">
            <Reveal>
              <h2 className="about__section-heading">Skills</h2>
            </Reveal>
            <div className="about__skills-grid">
              {skillCategories.map((cat, i) => (
                <Reveal key={cat.category} delay={i * 80}>
                  <div className="about__skill-group">
                    <h3 className="about__skill-category">{cat.category}</h3>
                    <ul className="about__skill-list">
                      {cat.items.map((item) => (
                        <li key={item} className="about__skill-item">{item}</li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="about__resume-section">
            <Reveal>
              <h2 className="about__section-heading">Education</h2>
            </Reveal>
            <Reveal delay={80}>
              <div className="about__edu-entry">
                <div className="about__exp-header">
                  <div className="about__exp-left">
                    <h3 className="about__exp-company">
                      Indiana University Northwest
                      <span className="about__exp-location"> / Gary, IN</span>
                    </h3>
                    <p className="about__exp-role">Bachelor of Science in Accounting</p>
                  </div>
                  <span className="about__exp-dates">Expected May 2026</span>
                </div>
                <p className="about__edu-meta">
                  GPA: 3.91 / 4.00
                  <span className="about__edu-sep"> Â· </span>
                  CPA candidate eligible May 2026
                  <span className="about__edu-sep"> Â· </span>
                  Accounting Club
                  <span className="about__edu-sep"> Â· </span>
                  Investment Club
                </p>
              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  )
}

/* â”€â”€â”€ Page: Contact â”€â”€â”€ */
function ContactPage() {
  return <Contact />
}

/* â”€â”€â”€ Mobile One-Pager â”€â”€â”€ */
function MobileOnePager() {
  return (
    <>
      <Hero />
      <WorkStickyScroll />
      <Contact />
    </>
  )
}

/* â”€â”€â”€ Smooth scroll (Lenis) â”€â”€â”€ */
function useLenis() {
  const lenisRef = useRef(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    })
    lenisRef.current = lenis

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return lenisRef
}

/* â”€â”€â”€ Scroll to top on route change â”€â”€â”€ */
function ScrollToTop({ lenisRef }) {
  const { pathname } = useLocation()
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, lenisRef])
  return null
}

/* â”€â”€â”€ App â”€â”€â”€ */
function App() {
  const isMobile = useIsMobile()
  const location = useLocation()
  const lenisRef = useLenis()

  return (
    <>
      <NoiseOverlay />
      <Navbar />
      <ScrollToTop lenisRef={lenisRef} />
      {isMobile ? (
        <MobileOnePager />
      ) : (
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/work" element={<WorkPage />} />
            <Route path="/work/:slug" element={<ProjectDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </PageTransition>
      )}
      <Footer />
    </>
  )
}

export default App
