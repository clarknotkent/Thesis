<template>
  <div
    ref="container"
    class="svg-bar-chart"
    :style="{ height: height + 'px' }"
  >
    <svg
      :viewBox="`0 0 ${svgWidth} ${height}`"
      preserveAspectRatio="xMidYMid meet"
      class="chart-svg"
      role="img"
      :aria-labelledby="svgLabelId"
      tabindex="0"
    >
      <title :id="titleId">{{ title }}</title>
      <desc
        v-if="description"
        :id="descId"
      >{{ description }}</desc>

      <!-- subtle background -->
      <rect
        :x="0"
        :y="0"
        :width="svgWidth"
        :height="height"
        fill="transparent"
      />

      <!-- horizontal grid lines and y labels -->
      <g
        v-if="showGrid"
        class="grid"
      >
        <line
          v-for="(tick, i) in yTicks"
          :key="i"
          :x1="leftPad"
          :x2="svgWidth - rightPad"
          :y1="yPosFromTick(tick)"
          :y2="yPosFromTick(tick)"
          stroke="#e9ecef"
          stroke-width="1"
        />
        <text
          v-for="(tick, i) in yTicks"
          :key="'t'+i"
          :x="leftPad - 12"
          :y="yPosFromTick(tick) + 4"
          text-anchor="end"
          :font-size="fontSizeTicks"
          fill="#6c757d"
        >{{ formatTick(tick) }}</text>
      </g>

      <!-- bars -->
      <g class="bars">
        <g
          v-for="(d, i) in chartData"
          :key="i"
        >
          <rect
            :class="['bar-rect', entered ? 'entered' : '']"
            :x="barX(i)"
            :y="barY(d.value)"
            :width="barWidth"
            :height="barHeight(d.value)"
            :fill="d.color"
            :rx="barCornerRadius"
            :style="{ transitionDelay: (stagger ? i * staggerMs : 0) + 'ms' }"
            :aria-label="d.label + ': ' + d.value"
            role="img"
          />

          <!-- percent label above bar -->
          <text
            :x="barX(i) + barWidth/2"
            :y="Math.max( topPad + 12, barY(d.value) - 8 )"
            text-anchor="middle"
            font-weight="700"
            :font-size="fontSizeValue"
            fill="#111"
          >
            {{ formatPercent(d.value) }}
          </text>

          <!-- x-axis label (wrapped) -->
          <text
            :x="barX(i) + barWidth/2"
            :y="height - 8 - (maxLines * (lineHeight/2))"
            text-anchor="middle"
            :font-size="fontSizeLabel"
            fill="#6c757d"
          >
            <tspan
              v-for="(ln, li) in splitLabelLines(d.label)"
              :key="li"
              :x="barX(i) + barWidth/2"
              :dy="li === 0 ? 0 : lineHeight"
            >{{ ln }}</tspan>
          </text>
        </g>
      </g>
    </svg>

    <!-- screen-reader-friendly data list -->
    <ul
      :id="dataListId"
      class="sr-only"
    >
      <li
        v-for="(d, i) in chartData"
        :key="i"
      >
        {{ d.label }}: {{ d.value }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  height: { type: Number, default: 320 },
  colors: { type: Array, default: () => ['#1976ff', '#198754', '#19d3f5', '#ffc107', '#dc3545'] },
  gridSteps: { type: Number, default: 5 },

  // visual tuning props
  barCornerRadius: { type: Number, default: 8 },
  gapRatio: { type: Number, default: 0.6 },
  minBarWidth: { type: Number, default: 32 },
  maxBarWidth: { type: Number, default: 260 },
  showGrid: { type: Boolean, default: true },

  // animation props
  stagger: { type: Boolean, default: true },
  staggerMs: { type: Number, default: 80 },

  // accessibility
  title: { type: String, default: 'Bar chart' },
  description: { type: String, default: '' }
})

const container = ref(null)
const containerWidth = ref(900)
const entered = ref(false)

const chartData = computed(() => props.data.map((d, i) => ({ ...d, color: d.color || props.colors[i % props.colors.length] })))

const minLeftPad = 40
const minRightPad = 20
const topPad = 24

// Label wrapping and sizing
const lineHeight = 14
const baseBottomPad = 32
const extraBottomPerLine = 14
const maxLabelCharsPerLine = 10
const maxLabelLines = 3

// Dynamic font sizes
const fontSizeTicks = computed(() => 10)
const fontSizeValue = computed(() => 10)
const fontSizeLabel = computed(() => 10)

const resizeObserver = ref(null)

const nBars = computed(() => Math.max(1, chartData.value.length))

const rawBarWidth = computed(() => {
  const usable = Math.max(160, containerWidth.value - minLeftPad - minRightPad)
  const denom = nBars.value + props.gapRatio * (nBars.value - 1)
  return Math.floor(usable / denom)
})

const barWidth = computed(() => Math.max(props.minBarWidth, Math.min(props.maxBarWidth, rawBarWidth.value)))
const gap = computed(() => Math.round(barWidth.value * props.gapRatio))

const contentWidth = computed(() => nBars.value * barWidth.value + (nBars.value - 1) * gap.value)

const leftPad = computed(() => Math.max(minLeftPad, Math.floor((containerWidth.value - contentWidth.value) / 2)))
const rightPad = computed(() => Math.max(minRightPad, containerWidth.value - leftPad.value - contentWidth.value))

const svgWidth = computed(() => Math.max(containerWidth.value, leftPad.value + rightPad.value + contentWidth.value))

const height = props.height

// split label into lines (simple wrap)
const splitLabelLines = (label) => {
  const text = String(label || '')
  if (!text) return ['']
  const words = text.split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    const cand = line ? `${line} ${w}` : w
    if (cand.length <= maxLabelCharsPerLine) {
      line = cand
    } else {
      if (line) lines.push(line)
      // hard wrap long word if needed
      if (w.length > maxLabelCharsPerLine) {
        let i = 0
        while (i < w.length && lines.length < maxLabelLines - 1) {
          lines.push(w.slice(i, i + maxLabelCharsPerLine))
          i += maxLabelCharsPerLine
        }
        line = ''
      } else {
        line = w
      }
    }
    if (lines.length >= maxLabelLines) break
  }
  if (line && lines.length < maxLabelLines) lines.push(line)
  return lines.slice(0, maxLabelLines)
}

const maxLines = computed(() => Math.max(1, ...chartData.value.map(d => splitLabelLines(d.label).length)))
const bottomPad = computed(() => baseBottomPad + (maxLines.value - 1) * extraBottomPerLine)
const heightInner = computed(() => Math.max(48, height - topPad - bottomPad.value))

const maxValue = computed(() => {
  if (!props.data || props.data.length === 0) return 100
  const max = Math.max(...props.data.map(d => d.value)) || 0
  if (max <= 50) return Math.ceil(max / 10) * 10 || 10
  if (max <= 200) return Math.ceil(max / 25) * 25
  return Math.ceil(max / 50) * 50
})

const yTicks = computed(() => {
  const steps = Math.max(2, props.gridSteps)
  const max = maxValue.value
  return Array.from({ length: steps }, (_, i) => Math.round(i * (max / (steps - 1))))
})

const yPosFromTick = (tick) => {
  const max = maxValue.value || 1
  const ratio = tick / max
  return Math.round(topPad + (1 - ratio) * heightInner.value)
}

const barHeight = (val) => {
  const max = maxValue.value || 1
  const ratio = Math.min(1, Math.max(0, val / max))
  return Math.max(2, Math.round(ratio * heightInner.value))
}

const barY = (val) => {
  return topPad + (heightInner.value - barHeight(val))
}

const barX = (i) => leftPad.value + i * (barWidth.value + gap.value)

const formatPercent = (val) => {
  const max = maxValue.value || 1
  const pct = (val / max) * 100
  return pct >= 10 ? Math.round(pct) + '%' : pct.toFixed(1) + '%'
}

const formatTick = (tick) => tick

// accessibility ids
const uid = Math.random().toString(36).slice(2, 9)
const titleId = `chart-title-${uid}`
const descId = `chart-desc-${uid}`
const dataListId = `chart-data-${uid}`
const svgLabelId = descId && props.description ? `${titleId} ${descId}` : titleId

function updateWidth() {
  if (!container.value) return
  const rect = container.value.getBoundingClientRect()
  containerWidth.value = Math.floor(rect.width)
}

onMounted(() => {
  nextTick(() => {
    updateWidth()
    setTimeout(() => (entered.value = true), 90)

    if ('ResizeObserver' in window && container.value) {
      resizeObserver.value = new ResizeObserver(() => updateWidth())
      resizeObserver.value.observe(container.value)
    } else {
      window.addEventListener('resize', updateWidth)
    }
  })
})

onBeforeUnmount(() => {
  if (resizeObserver.value && container.value) resizeObserver.value.unobserve(container.value)
  else window.removeEventListener('resize', updateWidth)
})
</script>

<style scoped>
.svg-bar-chart {
  width: 100%;
  box-sizing: border-box;
}
.chart-svg {
  width: 100%;
  height: 100%;
  display: block;
}
.bar-rect {
  transform-origin: center bottom;
  transform: scaleY(0);
  transition: transform 700ms cubic-bezier(.2,.9,.2,1);
}
.bar-rect.entered {
  transform: scaleY(1);
}

/* visually-hidden for screen readers */
.sr-only {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
