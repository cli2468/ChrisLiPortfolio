import { useEffect, useLayoutEffect, useRef } from 'react'

/* "chris li" handwritten signature, drawn on stroke-by-stroke.
   Single-line CENTERLINE paths skeletonized from src/assets/chris-li.png
   (611x121 -> viewBox "0 0 611 121"), split into connected components so each
   stroke draws cleanly. The two i-dots and the trailing period are rendered as
   small circles that pop in (they are too small to "draw").
   Strokes drawn by animating stroke-dashoffset 1 -> 0 with pathLength="1"
   normalisation, which is reliable on mobile. */

const STROKES = [
  // chr (with tall h)
  'M 56.00,50.00 L 54.00,50.00 L 52.00,49.00 L 50.00,49.00 L 48.00,49.20 L 46.00,49.60 L 44.00,50.20 L 42.00,50.60 L 40.00,51.40 L 38.00,52.00 L 36.00,52.80 L 34.00,53.80 L 32.00,55.00 L 30.00,56.20 L 28.00,57.40 L 26.00,58.80 L 24.00,60.40 L 22.00,62.00 L 20.00,64.00 L 18.00,66.00 L 16.20,68.00 L 14.60,70.00 L 13.20,72.00 L 11.60,74.00 L 10.40,76.00 L 9.20,78.00 L 8.00,80.00 L 7.00,82.00 L 6.40,84.00 L 5.60,86.00 L 5.00,88.00 L 4.40,90.00 L 4.00,92.00 L 4.00,94.00 L 4.00,96.00 L 4.20,98.00 L 4.60,100.00 L 5.60,102.00 L 6.60,104.00 L 8.20,106.00 L 10.00,108.00 L 12.00,109.80 L 14.00,111.20 L 16.00,112.20 L 18.00,112.80 L 20.00,113.20 L 22.00,113.60 L 24.00,114.00 L 26.00,114.00 L 28.00,114.00 L 30.00,114.00 L 32.00,114.00 L 34.00,114.00 L 36.00,114.00 L 38.00,113.80 L 40.00,113.40 L 42.00,112.80 L 44.00,112.40 L 46.00,111.80 L 48.00,111.40 L 50.00,110.60 L 52.00,109.80 L 54.00,109.00 L 56.00,108.20 L 58.00,107.20 L 60.00,106.20 L 62.00,105.20 L 64.00,104.00 L 66.00,102.80 L 68.00,101.60 L 70.00,100.40 L 72.00,99.00 L 74.00,97.60 L 76.00,96.20 L 78.00,94.60 L 80.00,93.00 L 82.00,91.00 L 84.00,89.00 L 86.00,87.00 L 87.60,85.00 L 89.00,83.00 L 90.40,81.00 L 91.60,79.00 L 93.00,77.00 L 94.40,75.20 L 96.00,73.80 L 97.80,73.80 L 99.00,75.00 L 99.60,77.00 L 100.00,79.00 L 100.00,81.00 L 100.40,83.00 L 100.80,85.00 L 101.20,87.00 L 101.60,89.00 L 102.00,91.00 L 102.40,93.00 L 102.80,95.00 L 103.40,97.00 L 104.20,99.00 L 105.20,101.00 L 106.40,103.00 L 108.00,104.80 L 110.00,105.40 L 111.80,104.60 L 113.40,103.00 L 114.80,101.00 L 116.40,99.00 L 117.40,97.00 L 118.60,95.00 L 119.60,93.00 L 121.00,91.00 L 122.40,89.00 L 123.60,87.00 L 124.80,85.00 L 126.00,83.00 L 127.40,81.00 L 128.80,79.00 L 130.40,77.00 L 132.00,75.00 L 134.00,73.00 L 136.00,71.00 L 138.00,69.00 L 140.00,67.40 L 142.00,66.00 L 144.00,64.80 L 146.00,63.80 L 148.00,63.20 L 150.00,63.00 L 152.00,63.40 L 154.00,64.40 L 156.00,66.00 L 157.40,68.00 L 158.40,70.00 L 159.20,72.00 L 160.00,74.00 L 160.60,76.00 L 161.20,78.00 L 161.60,80.00 L 162.00,82.00 L 162.40,84.00 L 162.80,86.00 L 163.00,88.00 L 163.20,90.00 L 163.60,92.00 L 164.00,94.00 L 164.20,96.00 L 164.60,98.00 L 165.00,100.00 L 165.40,102.00 L 166.00,104.00 L 167.00,106.00 L 168.00,108.00 L 168.00,110.00',
  // ri
  'M 197.00,106.00 L 197.00,104.00 L 196.00,102.00 L 196.00,100.00 L 196.00,98.00 L 196.00,96.00 L 196.00,94.00 L 196.00,92.00 L 196.00,90.00 L 195.80,88.00 L 195.40,86.00 L 195.40,84.00 L 195.80,82.00 L 196.00,80.00 L 196.00,78.00 L 196.00,76.00 L 196.00,74.00 L 196.40,72.00 L 196.80,70.00 L 197.40,68.00 L 198.20,66.00 L 199.40,64.00 L 201.00,62.00 L 203.00,60.20 L 205.00,58.80 L 207.00,58.20 L 209.00,58.00 L 211.00,57.60 L 213.00,57.20 L 215.00,57.40 L 217.00,57.80 L 219.00,58.00 L 221.00,58.20 L 223.00,58.60 L 225.00,59.20 L 227.00,59.60 L 229.00,60.40 L 231.00,60.80 L 233.00,61.40 L 235.00,62.20 L 237.00,63.00 L 239.00,63.60 L 241.00,64.40 L 243.00,65.00 L 245.00,65.60 L 247.00,66.40 L 249.00,67.00 L 251.00,67.60 L 253.00,68.40 L 255.00,69.20 L 257.00,70.00 L 259.00,70.80 L 261.00,71.80 L 263.00,72.80 L 265.00,73.20 L 267.00,73.20 L 269.00,73.20 L 270.40,74.20 L 271.00,76.00 L 271.00,78.00 L 271.00,80.00 L 271.00,82.00 L 271.00,84.00 L 271.00,86.00 L 271.40,88.00 L 271.80,90.00 L 272.00,92.00 L 272.20,94.00 L 272.60,96.00 L 273.00,98.00 L 273.40,100.00 L 274.00,102.00 L 275.20,103.80 L 277.00,105.00 L 279.00,105.00 L 280.00,103.00',
  // s
  'M 341.00,53.00 L 339.00,52.00 L 337.00,52.00 L 335.00,52.00 L 333.00,52.00 L 331.00,52.00 L 329.00,52.40 L 327.00,52.80 L 325.00,53.20 L 323.00,53.60 L 321.00,54.20 L 319.00,54.60 L 317.00,55.40 L 315.00,56.00 L 313.00,56.80 L 311.00,58.00 L 309.00,59.40 L 307.00,60.60 L 305.20,62.20 L 304.00,64.00 L 303.80,66.00 L 304.40,68.00 L 306.00,70.00 L 308.00,71.80 L 310.00,73.20 L 312.00,74.20 L 314.00,75.20 L 316.00,76.20 L 318.00,77.20 L 320.00,78.20 L 322.00,79.20 L 324.00,80.20 L 326.00,81.00 L 328.00,81.80 L 330.00,82.60 L 332.00,83.40 L 334.00,84.20 L 336.00,85.00 L 338.00,85.80 L 340.00,86.60 L 342.00,87.40 L 344.00,88.20 L 346.00,89.40 L 348.00,90.60 L 350.00,91.80 L 352.00,93.00 L 354.00,94.40 L 355.80,96.00 L 357.20,98.00 L 357.80,100.00 L 357.40,102.00 L 356.00,104.00 L 354.00,105.80 L 352.00,107.20 L 350.00,108.00 L 348.00,108.60 L 346.00,109.40 L 344.00,110.00 L 342.00,110.60 L 340.00,111.40 L 338.00,111.80 L 336.00,112.40 L 334.00,112.80 L 332.00,113.20 L 330.00,113.60 L 328.00,114.00 L 326.00,114.00 L 324.00,114.40 L 322.00,114.80 L 320.00,115.00 L 318.00,115.00 L 316.00,115.00 L 314.00,115.00 L 312.00,115.00 L 310.00,115.00 L 308.00,115.00 L 306.00,114.80 L 304.00,114.40 L 302.00,113.40 L 300.40,112.00 L 299.40,110.00 L 299.40,108.00 L 300.00,106.00 L 302.00,104.00',
  // li
  'M 488.00,6.00 L 488.00,8.00 L 488.00,10.00 L 488.00,12.00 L 488.00,14.00 L 488.00,16.00 L 488.00,18.00 L 488.00,20.00 L 488.00,22.00 L 488.00,24.00 L 488.00,26.00 L 488.00,28.00 L 488.00,30.00 L 488.00,32.00 L 488.00,34.00 L 488.00,36.00 L 488.00,38.00 L 488.00,40.00 L 487.80,42.00 L 487.40,44.00 L 487.00,46.00 L 487.00,48.00 L 487.00,50.00 L 487.00,52.00 L 487.00,54.00 L 487.00,56.00 L 487.00,58.00 L 487.00,60.00 L 487.00,62.00 L 487.00,64.00 L 487.00,66.00 L 487.00,68.00 L 487.00,70.00 L 487.00,72.00 L 487.00,74.00 L 487.00,76.00 L 487.00,78.00 L 487.00,80.00 L 487.20,82.00 L 487.60,84.00 L 488.00,86.00 L 488.00,88.00 L 488.00,90.00 L 488.20,92.00 L 488.60,94.00 L 489.00,96.00 L 489.20,98.00 L 489.60,100.00 L 490.20,102.00 L 490.80,104.00 L 491.60,106.00 L 492.60,108.00 L 494.00,110.00 L 496.00,112.00 L 498.00,113.80 L 500.00,114.80 L 502.00,115.00 L 504.00,114.60 L 506.00,113.80 L 508.00,112.80 L 510.00,111.60 L 512.00,110.00 L 514.00,108.00 L 515.80,106.00 L 517.40,104.00 L 519.00,102.00 L 521.00,100.00 L 522.60,98.00 L 524.20,96.00 L 525.60,94.00 L 527.00,92.00 L 528.40,90.00 L 529.60,88.00 L 531.00,86.00 L 532.40,84.00 L 533.60,82.00 L 535.00,80.00 L 536.20,78.00 L 537.40,76.00 L 538.60,74.00 L 540.20,72.00 L 542.00,70.40 L 544.00,69.60 L 545.40,70.20 L 546.00,72.00 L 546.00,74.00 L 546.00,76.00 L 546.00,78.00 L 546.40,80.00 L 546.80,82.00 L 547.00,84.00 L 547.00,86.00 L 547.00,88.00 L 547.00,90.00 L 547.40,92.00 L 547.80,94.00 L 548.40,96.00 L 549.00,98.00 L 549.80,100.00 L 550.60,102.00 L 551.60,104.00 L 552.60,106.00 L 554.20,108.00 L 556.00,110.00 L 558.00,111.40 L 560.00,112.20 L 562.00,112.60 L 564.00,112.60 L 566.00,112.00 L 568.00,111.00 L 570.00,110.00',
]

// i-dots + trailing period, as [cx, cy, r]
const DOTS = [
  [274.0, 23.0, 2.6], // i-dot (chris)
  [547.2, 27.5, 2.6], // i-dot (li)
  [606.0, 111.0, 2.6], // period
]

// Per-stroke draw time (s), roughly proportional to length. Snappy.
const STROKE_DURATIONS = [0.3, 0.18, 0.2, 0.26]
// Gap before each stroke. There's an extra pause before "li" (index 3) so the
// "chris" i-dot can finish landing before the pen moves on to "li".
const DOT_DURATION = 0.14
const STROKE_GAPS = [0, 0.015, 0.015, DOT_DURATION + 0.01]

const STROKE_DELAYS = STROKE_DURATIONS.reduce(
  (acc, _d, i) => [...acc, i === 0 ? 0 : acc[i - 1] + STROKE_DURATIONS[i - 1] + STROKE_GAPS[i]],
  [],
)
const STROKES_END = STROKE_DELAYS[STROKE_DELAYS.length - 1] + STROKE_DURATIONS[STROKE_DURATIONS.length - 1]

// Dot timing. The "chris" i-dot lands in the pause after "s" finishes and before
// "li" begins. The "li" i-dot and trailing period land after all strokes.
const S_END = STROKE_DELAYS[2] + STROKE_DURATIONS[2] // when "s" finishes
const DOT_DELAYS = [
  S_END + 0.02,       // chris i-dot — finishes before "li" starts
  STROKES_END + 0.08, // li i-dot
  STROKES_END + 0.2,  // period
]

export const SIGNATURE_TOTAL_MS = Math.round(
  (DOT_DELAYS[DOT_DELAYS.length - 1] + DOT_DURATION) * 1000,
)

const EASE = 'cubic-bezier(0.33, 0, 0.3, 1)'

export function Signature({ className = '', start = true, static: isStatic = false, ...props }) {
  const pathRefs = useRef([])
  const dotRefs = useRef([])

  useLayoutEffect(() => {
    if (isStatic) return
    pathRefs.current.forEach((p) => {
      if (!p) return
      p.style.transition = 'none'
      p.style.strokeDasharray = '1'
      p.style.strokeDashoffset = '1'
    })
    dotRefs.current.forEach((c) => {
      if (!c) return
      c.style.transition = 'none'
      c.style.opacity = '0'
      c.style.transform = 'scale(0.4)'
    })
  }, [isStatic])

  useEffect(() => {
    if (isStatic || !start) return
    const raf = requestAnimationFrame(() => {
      pathRefs.current.forEach((p, i) => {
        if (!p) return
        p.style.strokeDasharray = '1'
        p.style.strokeDashoffset = '1'
        void p.getBoundingClientRect()
        p.style.transition = `stroke-dashoffset ${STROKE_DURATIONS[i]}s ${EASE} ${STROKE_DELAYS[i]}s`
        p.style.strokeDashoffset = '0'
      })
      dotRefs.current.forEach((c, i) => {
        if (!c) return
        void c.getBoundingClientRect()
        c.style.transition = `opacity ${DOT_DURATION}s ease ${DOT_DELAYS[i]}s, transform ${DOT_DURATION}s ${EASE} ${DOT_DELAYS[i]}s`
        c.style.opacity = '1'
        c.style.transform = 'scale(1)'
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [start, isStatic])

  return (
    <svg
      viewBox="0 0 611 121"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`signature-svg ${className}`.trim()}
      {...props}
    >
      {STROKES.map((d, i) => (
        <path
          key={'s' + i}
          ref={(el) => (pathRefs.current[i] = el)}
          d={d}
          pathLength="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {DOTS.map(([cx, cy, r], i) => (
        <circle
          key={'d' + i}
          ref={(el) => (dotRefs.current[i] = el)}
          cx={cx}
          cy={cy}
          r={r}
          fill="currentColor"
          stroke="none"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
    </svg>
  )
}

export default Signature
