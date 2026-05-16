import { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from 'react'
import { motion, useMotionValue, useSpring, animate } from 'motion/react'

const CSSBox = forwardRef(function CSSBox(
  {
    width = 200,
    height = 200,
    depth = 200,
    perspective = 600,
    stiffness = 100,
    damping = 30,
    faces = {},
    className = '',
    style = {},
    draggable = true,
    autoSpin = true,
    initialRotateX = -15,
    initialRotateY = 25,
    onDragChange,
    hintOnMount = false,
    hintDelay = 900,
  },
  ref,
) {
  const containerRef = useRef(null)
  const rotateX = useMotionValue(initialRotateX)
  const rotateY = useMotionValue(initialRotateY)
  const springX = useSpring(rotateX, { stiffness, damping })
  const springY = useSpring(rotateY, { stiffness, damping })

  const stateRef = useRef({
    dragging: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
  })

  useImperativeHandle(ref, () => ({
    rotateTo: (x, y) => {
      rotateX.set(x)
      rotateY.set(y)
    },
    showFace: (face) => {
      const targets = {
        front: [0, 0],
        back: [0, 180],
        right: [0, -90],
        left: [0, 90],
        top: [-90, 0],
        bottom: [90, 0],
      }
      const [tx, ty] = targets[face] || [0, 0]
      rotateX.set(tx)
      rotateY.set(ty)
    },
  }), [rotateX, rotateY])

  useEffect(() => {
    if (!autoSpin) return
    let cancelled = false
    const controls = animate(rotateY, [rotateY.get(), rotateY.get() + 360], {
      duration: 30,
      ease: 'linear',
      repeat: Infinity,
      onUpdate: () => { if (cancelled) controls.stop() },
    })
    return () => {
      cancelled = true
      controls.stop()
    }
  }, [autoSpin, rotateY])

  // One-time "you can drag me" hint: after a short delay, sweep the cube
  // through a small rotation and back. Cancels instantly if the user grabs
  // it, so the hint never fights real interaction.
  useEffect(() => {
    if (!hintOnMount) return
    let ctrlX, ctrlY
    let stopped = false

    const baseX = rotateX.get()
    const baseY = rotateY.get()

    const timer = window.setTimeout(() => {
      if (stateRef.current.dragging) return
      // Simulate a single drag gesture: smooth, continuous motion up and to
      // the right, decelerating to a stop and holding there — like someone
      // grabbed it, dragged, and let go. No return, no overshoot, no twitch.
      // Drag right => rotateY +, drag up => rotateX + (matches drag handler).
      // Real drag-to-flick: slow grab, accelerate into the throw, then a
      // short momentum overshoot that decays back. Keyframes give the
      // accelerate→overshoot→settle shape; per-segment eases shape the feel.
      ctrlY = animate(rotateY, [baseY, baseY + 95, baseY + 108, baseY + 102], {
        duration: 1.15,
        times: [0, 0.62, 0.82, 1],
        ease: ['easeIn', 'easeOut', 'easeOut'],
        onUpdate: () => { if (stopped || stateRef.current.dragging) ctrlY?.stop() },
      })
      ctrlX = animate(rotateX, [baseX, baseX + 58, baseX + 66, baseX + 62], {
        duration: 1.15,
        times: [0, 0.62, 0.82, 1],
        ease: ['easeIn', 'easeOut', 'easeOut'],
        onUpdate: () => { if (stopped || stateRef.current.dragging) ctrlX?.stop() },
      })
    }, hintDelay)

    return () => {
      stopped = true
      window.clearTimeout(timer)
      ctrlX?.stop()
      ctrlY?.stop()
    }
  }, [hintOnMount, hintDelay, rotateX, rotateY])

  // Non-passive touchmove guard: React's synthetic listeners are passive, so
  // preventDefault() there is ignored. While dragging, block native touch
  // scrolling explicitly so a cube drag can never turn into a page scroll.
  useEffect(() => {
    if (!draggable) return
    const el = containerRef.current
    if (!el) return
    const block = (ev) => {
      if (stateRef.current.dragging && ev.cancelable) ev.preventDefault()
    }
    el.addEventListener('touchmove', block, { passive: false })
    return () => el.removeEventListener('touchmove', block)
  }, [draggable])

  const onPointerDown = useCallback((e) => {
    if (!draggable) return
    const s = stateRef.current
    s.lastX = e.clientX
    s.lastY = e.clientY
    // Capture FIRST. If capture succeeds the gesture is locked to this
    // element and the browser won't reclaim it as a page scroll. Only
    // then mark as dragging so a failed capture can't leave us half-armed.
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
      s.pointerId = e.pointerId
      s.dragging = true
      onDragChange?.(true)
    } catch {
      s.dragging = false
    }
  }, [draggable, onDragChange])

  const onPointerMove = useCallback((e) => {
    const s = stateRef.current
    if (!s.dragging) return
    // Suppress any residual scroll/gesture the browser might still attempt.
    if (e.cancelable) e.preventDefault()
    const dx = e.clientX - s.lastX
    const dy = e.clientY - s.lastY
    rotateY.set(rotateY.get() + dx * 0.4)
    rotateX.set(rotateX.get() - dy * 0.4)
    s.lastX = e.clientX
    s.lastY = e.clientY
  }, [rotateX, rotateY])

  const onPointerUp = useCallback(() => {
    stateRef.current.dragging = false
    onDragChange?.(false)
  }, [onDragChange])

  const halfD = depth / 2
  const halfW = width / 2
  const halfH = height / 2

  const faceStyle = {
    position: 'absolute',
    width,
    height,
    top: 0,
    left: 0,
    backfaceVisibility: 'hidden',
    touchAction: draggable ? 'none' : 'auto',
  }

  const faceTransforms = {
    front: `translateZ(${halfD}px)`,
    back: `rotateY(180deg) translateZ(${halfD}px)`,
    right: `rotateY(90deg) translateZ(${halfW}px)`,
    left: `rotateY(-90deg) translateZ(${halfW}px)`,
    top: `rotateX(90deg) translateZ(${halfH}px)`,
    bottom: `rotateX(-90deg) translateZ(${halfH}px)`,
  }

  return (
    <div
      ref={containerRef}
      className={`css-box ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        width,
        height,
        perspective: `${perspective}px`,
        position: 'relative',
        touchAction: draggable ? 'none' : 'auto',
        cursor: draggable ? 'grab' : 'default',
        ...style,
      }}
    >
      <motion.div
        style={{
          width,
          height,
          position: 'relative',
          transformStyle: 'preserve-3d',
          touchAction: draggable ? 'none' : 'auto',
          rotateX: springX,
          rotateY: springY,
        }}
      >
        {['front', 'back', 'right', 'left', 'top', 'bottom'].map((face) => (
          faces[face] ? (
            <div
              key={face}
              style={{ ...faceStyle, transform: faceTransforms[face] }}
            >
              {faces[face]}
            </div>
          ) : null
        ))}
      </motion.div>
    </div>
  )
})

export default CSSBox
