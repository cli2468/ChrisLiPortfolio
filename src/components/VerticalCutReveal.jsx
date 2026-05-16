import { useMemo, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'motion/react'

function splitText(text, splitBy) {
  if (splitBy === 'characters') {
    return text.split(/(\s+)/).map((segment) => {
      if (/^\s+$/.test(segment)) return [segment]
      return Array.from(segment)
    })
  }
  if (splitBy === 'words') {
    return text.split(/(\s+)/).map((segment) => [segment])
  }
  if (splitBy === 'lines') {
    return text.split('\n').map((line) => [line])
  }
  return [[text]]
}

function computeStaggerDelays(totalItems, staggerFrom, staggerDuration) {
  const delays = new Array(totalItems)
  let originIndex = 0
  if (staggerFrom === 'last') originIndex = totalItems - 1
  else if (staggerFrom === 'center') originIndex = (totalItems - 1) / 2
  else if (staggerFrom === 'random') originIndex = Math.floor(Math.random() * totalItems)
  else if (typeof staggerFrom === 'number') originIndex = staggerFrom

  for (let i = 0; i < totalItems; i++) {
    delays[i] = Math.abs(i - originIndex) * staggerDuration
  }
  return delays
}

const VerticalCutReveal = forwardRef(function VerticalCutReveal(
  {
    children,
    splitBy = 'characters',
    staggerDuration = 0.025,
    staggerFrom = 'first',
    reverse = false,
    transition = { type: 'spring', stiffness: 200, damping: 21 },
    autoStart = true,
    start = true,
    containerClassName = '',
    elementLevelClassName = '',
    onComplete,
    ...rest
  },
  ref,
) {
  const containerRef = useRef(null)
  const inView = useInView(containerRef, { once: true, amount: 0.1 })
  const [manualStart, setManualStart] = useState(false)

  const shouldPlay = autoStart ? inView : (start || manualStart)

  useImperativeHandle(ref, () => ({
    startAnimation: () => setManualStart(true),
  }), [])

  const segments = useMemo(() => splitText(children, splitBy), [children, splitBy])

  const flatItems = useMemo(() => {
    const all = []
    segments.forEach((segment, segIdx) => {
      segment.forEach((item, itemIdx) => {
        all.push({ value: item, segIdx, itemIdx })
      })
    })
    return all
  }, [segments])

  const delays = useMemo(
    () => computeStaggerDelays(flatItems.length, staggerFrom, staggerDuration),
    [flatItems.length, staggerFrom, staggerDuration],
  )

  const baseDelay = transition?.delay ?? 0
  const finalTransition = { ...transition }
  delete finalTransition.delay

  let lastAnimIndex = -1
  let maxDelay = 0
  delays.forEach((d, i) => {
    if (d >= maxDelay) {
      maxDelay = d
      lastAnimIndex = i
    }
  })

  let runningIndex = 0

  return (
    <span
      ref={containerRef}
      className={containerClassName}
      style={{ display: 'inline-block', whiteSpace: 'pre-wrap' }}
      {...rest}
    >
      {segments.map((segment, segIdx) => (
        <span
          key={segIdx}
          style={{ display: 'inline-block', whiteSpace: splitBy === 'characters' ? 'nowrap' : 'normal' }}
        >
          {segment.map((item, itemIdx) => {
            const isWhitespace = /^\s+$/.test(item)
            if (isWhitespace) {
              return (
                <span key={itemIdx} style={{ whiteSpace: 'pre' }}>{item}</span>
              )
            }
            const flatIndex = runningIndex++
            const delay = baseDelay + delays[flatIndex]
            const isLast = flatIndex === lastAnimIndex
            return (
              <span
                key={itemIdx}
                style={{
                  display: 'inline-block',
                  overflow: 'hidden',
                  verticalAlign: 'bottom',
                  paddingTop: '0.15em',
                  marginTop: '-0.15em',
                  paddingBottom: '0.2em',
                  marginBottom: '-0.2em',
                }}
              >
                <motion.span
                  className={elementLevelClassName}
                  style={{ display: 'inline-block', willChange: 'transform' }}
                  initial={{ y: reverse ? '-130%' : '130%' }}
                  animate={shouldPlay ? { y: '0%' } : { y: reverse ? '-130%' : '130%' }}
                  transition={{ ...finalTransition, delay }}
                  onAnimationComplete={isLast && onComplete ? onComplete : undefined}
                >
                  {item}
                </motion.span>
              </span>
            )
          })}
        </span>
      ))}
    </span>
  )
})

export default VerticalCutReveal
