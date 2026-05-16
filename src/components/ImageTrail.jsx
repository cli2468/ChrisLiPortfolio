import { useRef, useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

function rand(min, max) {
  return min + Math.random() * (max - min)
}

export default function ImageTrail({
  images = [],
  threshold,
  thresholdRange,
  imageSize = 200,
  trailLength = 5,
  fadeDuration = 0.8,
  rotationRange = 14,
  lifespan = 900,
  className = '',
  style = {},
  scope = null,
  deadZone = null, // { x, y, width, height } in scope-local coords, OR a ref to an element
  paused = false,
}) {
  const containerRef = useRef(null)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const lastFiredAtRef = useRef(0)
  const velocityRef = useRef({ vx: 0, vy: 0 })
  const lastMoveAtRef = useRef(0)
  const lastMovePosRef = useRef({ x: 0, y: 0 })
  const pathAccumRef = useRef(0)        // accumulated path length since last spawn
  const lastDirRef = useRef(null)       // last movement direction (unit vector)
  const erraticRef = useRef(0)          // 0 = clean, 1 = very erratic (smoothed)
  const nextThresholdRef = useRef(
    Array.isArray(thresholdRange) ? rand(thresholdRange[0], thresholdRange[1]) : (threshold ?? 80)
  )
  const indexCounterRef = useRef(0)
  const imageCursorRef = useRef(0)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const [items, setItems] = useState([])

  const handleRemove = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  useEffect(() => {
    function processEvent(e) {
      if (pausedRef.current) return
      const scopeEl = scope?.current
      const rect = scopeEl ? scopeEl.getBoundingClientRect() : null
      if (rect) {
        // Only track when cursor is inside the scoped element
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return
      }
      let x = rect ? e.clientX - rect.left : e.clientX
      let y = rect ? e.clientY - rect.top : e.clientY

      // Dead zone: skip firing if cursor is inside the protected region.
      // deadZone can be either { x, y, width, height } in scope-local coords
      // or a ref to an element whose bounding box defines the dead zone.
      if (deadZone) {
        let dz = null
        if (deadZone.current) {
          const dzRect = deadZone.current.getBoundingClientRect()
          if (rect) {
            dz = {
              x: dzRect.left - rect.left,
              y: dzRect.top - rect.top,
              width: dzRect.width,
              height: dzRect.height,
            }
          } else {
            dz = { x: dzRect.left, y: dzRect.top, width: dzRect.width, height: dzRect.height }
          }
        } else if (typeof deadZone === 'object') {
          dz = deadZone
        }
        if (dz && x >= dz.x && x <= dz.x + dz.width && y >= dz.y && y <= dz.y + dz.height) {
          // Still update last position so motion tracking stays accurate
          lastPosRef.current = { x, y }
          return
        }
      }

      // Smooth velocity tracking — exponential average of px/ms
      const tNow = performance.now()
      const dt = Math.max(1, tNow - lastMoveAtRef.current)
      const lm = lastMovePosRef.current
      const segDX = x - lm.x
      const segDY = y - lm.y
      const segLen = Math.sqrt(segDX * segDX + segDY * segDY)
      const instVX = segDX / dt
      const instVY = segDY / dt
      // Blend new measurement (60%) with prior smoothed velocity (40%)
      velocityRef.current.vx = velocityRef.current.vx * 0.4 + instVX * 0.6
      velocityRef.current.vy = velocityRef.current.vy * 0.4 + instVY * 0.6

      // Erratic detection: how sharply did direction change vs. the last segment?
      if (segLen > 0.5) {
        const ndx = segDX / segLen
        const ndy = segDY / segLen
        const prevDir = lastDirRef.current
        if (prevDir) {
          // dot of unit vectors: 1 = same direction, -1 = full reversal
          const dot = ndx * prevDir.x + ndy * prevDir.y
          // turn = 0 (straight) .. 1 (reversed); smooth it
          const turn = (1 - dot) / 2
          erraticRef.current = erraticRef.current * 0.6 + turn * 0.4
        }
        lastDirRef.current = { x: ndx, y: ndy }
      }

      // Accumulate path length toward the distance-based spawn threshold
      pathAccumRef.current += segLen

      lastMoveAtRef.current = tNow
      lastMovePosRef.current = { x, y }

      // Images are intentionally NOT clamped to the scope bounds — they may
      // spill off-screen for a more dynamic, unconfined trail.

      // --- Spawn decision: path-distance driven, with a speed-adaptive rate cap ---
      const thr = nextThresholdRef.current

      // Distance gate: must have travelled one threshold of PATH since last spawn.
      if (pathAccumRef.current < thr) return

      // Speed-adaptive time gate. The minimum gap between spawns shrinks the more
      // path you've banked: slow motion (barely 1 threshold) gets the full pacing
      // delay so it doesn't spam; fast flicks (many thresholds banked) get almost
      // no delay so they lay down a dense ribbon that keeps up with the cursor.
      const now = performance.now()
      const SLOW_GAP = 120 // ms — pacing when moving slowly
      const FAST_GAP = 16  // ms — near-unthrottled for fast flicks
      // How many thresholds of path are banked? 1 = slow, 4+ = hard flick.
      const banked = pathAccumRef.current / thr
      // Map banked 1→SLOW_GAP, 4→FAST_GAP (linear, clamped).
      const t = Math.min(1, Math.max(0, (banked - 1) / 3))
      const gap = SLOW_GAP + (FAST_GAP - SLOW_GAP) * t
      if (now - lastFiredAtRef.current < gap) {
        // Don't bank unlimited credit while waiting on the (slow-case) timer,
        // or the distance gate becomes permanently satisfied. Cap generously
        // so a fast flick can still keep several thresholds queued.
        pathAccumRef.current = Math.min(pathAccumRef.current, thr * 5)
        return
      }

      // Consume one threshold's worth of path. Keep the remainder (capped) so a
      // fast multi-sample batch spawns several evenly-spaced images in a row.
      pathAccumRef.current = Math.min(pathAccumRef.current - thr, thr * 4)

      lastPosRef.current = { x, y }
      lastFiredAtRef.current = now

      // Roll a new distance threshold for the next spawn
      nextThresholdRef.current = Array.isArray(thresholdRange)
        ? rand(thresholdRange[0], thresholdRange[1])
        : (threshold ?? 80)

      const id = indexCounterRef.current++
      const img = images[imageCursorRef.current % images.length]
      imageCursorRef.current++
      const rot = (Math.random() - 0.5) * 2 * rotationRange

      // Convert velocity (px/ms) into a fling offset (px). Cap so wild flicks don't shoot too far.
      // Erratic motion damps the fling: clean directional swipes keep full throw,
      // chaotic back-and-forth flicks settle near the cursor instead of jittering.
      const FLING_SCALE = 90 // multiplier
      const FLING_MAX = 140 // px cap each axis
      const erraticDamp = 1 - Math.min(1, erraticRef.current * 1.6) // 1 = clean, →0 = erratic
      let flingX = Math.max(-FLING_MAX, Math.min(FLING_MAX, velocityRef.current.vx * FLING_SCALE)) * erraticDamp
      let flingY = Math.max(-FLING_MAX, Math.min(FLING_MAX, velocityRef.current.vy * FLING_SCALE)) * erraticDamp

      // Fling target is intentionally unclamped — images may fly off-screen.

      setItems((prev) => {
        const next = [...prev, { id, x, y, img, rot, flingX, flingY }]
        return next.length > trailLength ? next.slice(next.length - trailLength) : next
      })

      setTimeout(() => handleRemove(id), lifespan)
    }

    function onMove(e) {
      // Use coalesced sub-events for fast motion — browsers batch pointermove,
      // so a single onMove may represent many in-between positions.
      const samples = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : null
      if (samples && samples.length > 1) {
        for (const s of samples) processEvent(s)
      } else {
        processEvent(e)
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [images, threshold, thresholdRange, trailLength, rotationRange, scope, lifespan, imageSize, deadZone, handleRemove])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        ...style,
      }}
    >
      <AnimatePresence>
        {items.map((item) => (
          <motion.img
            key={item.id}
            src={item.img}
            alt=""
            initial={{ opacity: 1, scale: 1.08, rotate: item.rot, x: 0, y: 0 }}
            animate={{
              opacity: 1,
              scale: [1.08, 0.92, 1.04, 1],
              rotate: item.rot,
              x: item.flingX,
              y: item.flingY,
              transition: {
                scale: {
                  duration: 0.42,
                  times: [0, 0.4, 0.75, 1],
                  ease: 'easeOut',
                },
                x: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                y: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            exit={{
              scale: [1, 1.1, 0],
              opacity: [1, 1, 0],
              rotate: item.rot,
              transition: {
                scale: {
                  duration: 0.35,
                  times: [0, 0.45, 1],
                  ease: ['easeOut', 'easeIn'],
                },
                opacity: {
                  duration: 0.35,
                  times: [0, 0.45, 1],
                  ease: 'easeIn',
                },
              },
            }}

            style={{
              position: 'absolute',
              top: item.y - imageSize / 2,
              left: item.x - imageSize / 2,
              width: imageSize,
              height: imageSize * 0.66,
              objectFit: 'cover',
              borderRadius: 8,
              pointerEvents: 'none',
              willChange: 'transform, opacity',
            }}
            draggable={false}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
