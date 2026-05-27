<script setup>
import { ref, computed } from 'vue'
import PptxGenJS from 'pptxgenjs'

const hoveredNode = ref(null)
const svgRef = ref(null)

const nodeMap = {
  disease:    { id: '疾病',    label: '疾病',     x: 480, y: 290, rx: 56, ry: 32, color: '#0d9488', bg: '#f0fdfa', border: '#5eead4' },
  exam:       { id: '检查',       label: '检查',     x: 480, y: 130, rx: 50, ry: 30, color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
  symptom:    { id: '症状',    label: '症状',     x: 240, y: 230, rx: 50, ry: 30, color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  medicine:   { id: '药物',   label: '药物',     x: 240, y: 430, rx: 50, ry: 30, color: '#db2777', bg: '#fdf2f8', border: '#f9a8d4' },
  department: { id: '就诊科室', label: '就诊科室', x: 455, y: 470, rx: 64, ry: 30, color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  food:       { id: '食物',       label: '食物',     x: 720, y: 390, rx: 50, ry: 30, color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
}

const nodes = Object.values(nodeMap)

function ellipseEdgePoint(node, tx, ty) {
  const dx = tx - node.x
  const dy = ty - node.y
  const a = Math.atan2(dy, dx)
  const c = Math.cos(a), s = Math.sin(a)
  const r = 1 / Math.sqrt((c * c) / (node.rx * node.rx) + (s * s) / (node.ry * node.ry))
  return { x: +(node.x + r * c).toFixed(1), y: +(node.y + r * s).toFixed(1) }
}

function buildEdge(fromId, toId, curve = 0) {
  const f = nodeMap[fromId], t = nodeMap[toId]
  const sp = ellipseEdgePoint(f, t.x, t.y)
  const ep = ellipseEdgePoint(t, f.x, f.y)

  if (curve === 0) {
    return {
      path: `M ${sp.x},${sp.y} L ${ep.x},${ep.y}`,
      lx: (sp.x + ep.x) / 2,
      ly: (sp.y + ep.y) / 2,
    }
  }

  const angle = Math.atan2(t.y - f.y, t.x - f.x)
  const pa = angle - Math.PI / 2
  const mx = (sp.x + ep.x) / 2, my = (sp.y + ep.y) / 2
  const cx = mx + curve * Math.cos(pa), cy = my + curve * Math.sin(pa)

  return {
    path: `M ${sp.x},${sp.y} Q ${cx.toFixed(1)},${cy.toFixed(1)} ${ep.x},${ep.y}`,
    lx: sp.x * 0.25 + cx * 0.5 + ep.x * 0.25,
    ly: sp.y * 0.25 + cy * 0.5 + ep.y * 0.25,
  }
}

function buildLoop(nodeId, placement = 'right') {
  const n = nodeMap[nodeId]

  // default: loop to the right side (avoids vertical clutter)
  if (placement === 'right') {
    const sx = +(n.x + n.rx * 0.85).toFixed(1)
    const sy1 = +(n.y - n.ry * 0.52).toFixed(1)
    const sy2 = +(n.y + n.ry * 0.52).toFixed(1)
    const w = 55
    const cx = n.x + n.rx + w
    return {
      path: `M ${sx},${sy1} C ${cx},${n.y - w * 0.75} ${cx},${n.y + w * 0.75} ${sx},${sy2}`,
      lx: cx + 14,
      ly: n.y,
    }
  }

  // top: loop above node (avoids right-side overlaps like disease -> food)
  const sy = +(n.y - n.ry * 0.85).toFixed(1)
  const sx1 = +(n.x - n.rx * 0.52).toFixed(1)
  const sx2 = +(n.x + n.rx * 0.52).toFixed(1)
  const w = 62
  const cy = n.y - n.ry - w
  return {
    path: `M ${sx1},${sy} C ${n.x - w * 0.75},${cy} ${n.x + w * 0.75},${cy} ${sx2},${sy}`,
    lx: n.x,
    ly: cy - 12,
  }
}

const edges = [
  { id: 'e1',  from: 'symptom',  to: 'exam',       label: 'correlation_symptom',                     ...buildEdge('symptom',  'exam',       0)  },
  { id: 'e3',  from: 'disease',  to: 'symptom',     label: 'has_symptom',                         ...buildEdge('disease',  'symptom',    0)  },
  { id: 'e4',  from: 'disease',  to: 'exam',        label: 'need_check',                     ...buildEdge('disease',  'exam',      22)  },
  { id: 'e5',  from: 'exam',     to: 'exam',        label: 'correlation_check',   selfLoop: true,   ...buildLoop('exam')                      },
  { id: 'e6',  from: 'disease',  to: 'disease',     label: 'accompany_with',     selfLoop: true,   ...buildLoop('disease', 'right')          },
  { id: 'e7',  from: 'medicine', to: 'symptom',     label: 'indication/contraindication/\noff-label use',  ...buildEdge('medicine', 'symptom',    45) },
  { id: 'e8',  from: 'medicine', to: 'disease',     label: 'indication/contraindication/\noff-label use',  ...buildEdge('medicine', 'disease',     0) },
  { id: 'e9',  from: 'disease',  to: 'department',  label: 'belongs_to',                     ...buildEdge('disease',  'department',  0) },
  { id: 'e10', from: 'disease',  to: 'food',        label: 'do_eat/not_eat',         ...buildEdge('disease',  'food',      -14) },
]

function isNodeConnected(nodeId) {
  if (!hoveredNode.value) return true
  if (nodeId === hoveredNode.value) return true
  return edges.some(
    (e) =>
      (e.from === hoveredNode.value && e.to === nodeId) ||
      (e.to === hoveredNode.value && e.from === nodeId),
  )
}

function isEdgeConnected(edge) {
  if (!hoveredNode.value) return true
  return edge.from === hoveredNode.value || edge.to === hoveredNode.value
}

function splitLabel(text) {
  return text.split('\n')
}

function stamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function getSvgElement() {
  const el = svgRef.value
  if (!el) return null
  return el
}

function exportCssText() {
  // 关键点：导出时必须把样式“内嵌”到 SVG 里，否则外部文件/Canvas 渲染会丢样式。
  // 这里用不带 scoped 选择器的规则，保证在任何环境都能还原视觉效果。
  return `
    .arrow-head{fill:#94a3b8}
    .edge-line{stroke:#94a3b8;stroke-width:1.5;stroke-dasharray:5 5}
    .edge-text{font-size:13px;font-weight:600;font-family:"Times New Roman","Noto Sans SC","Segoe UI",serif;fill:#475569;stroke:#ffffff;stroke-width:4.2;paint-order:stroke;pointer-events:none;user-select:none}
    .node-text{font-size:18px;font-weight:700;font-family:"Times New Roman","Noto Sans SC","Segoe UI",serif;pointer-events:none;user-select:none}
    .node-shape{stroke-width:2}
    .node-glow{opacity:0}
  `.trim()
}

function buildExportSvgElement() {
  const svg = getSvgElement()
  if (!svg) return null

  const clone = svg.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')

  // remove animation delays / hover dimming for export
  clone.querySelectorAll('.node-group').forEach((g) => {
    g.classList.remove('dimmed')
    g.classList.remove('active')
    g.style.removeProperty('--enter-delay')
  })
  clone.querySelectorAll('.edge-group').forEach((g) => g.classList.remove('dimmed'))

  // ensure white background in exported file
  const vb = clone.getAttribute('viewBox') || '0 0 960 600'
  const [, , w, h] = vb.split(/\s+/).map((v) => Number(v))
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  bg.setAttribute('x', '0')
  bg.setAttribute('y', '0')
  bg.setAttribute('width', String(w || 960))
  bg.setAttribute('height', String(h || 600))
  bg.setAttribute('fill', '#ffffff')
  clone.insertBefore(bg, clone.firstChild)

  // inline style for export fidelity
  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  styleEl.textContent = exportCssText()
  clone.insertBefore(styleEl, clone.firstChild?.nextSibling || clone.firstChild)

  return clone
}

function exportSvgString() {
  const clone = buildExportSvgElement()
  if (!clone) return null
  return new XMLSerializer().serializeToString(clone)
}

function svgToDataUri(svgText) {
  // Base64 to avoid charset/escape pitfalls in Office apps
  const encoded = btoa(unescape(encodeURIComponent(svgText)))
  return `data:image/svg+xml;base64,${encoded}`
}

function downloadSVG() {
  const xml = exportSvgString()
  if (!xml) return
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, `knowledge-graph-${stamp()}.svg`)
}

async function downloadPNG(scale = 2) {
  const svgText = exportSvgString()
  if (!svgText) return

  const vbMatch = svgText.match(/viewBox="([^"]+)"/)
  const vb = vbMatch?.[1] || '0 0 960 600'
  const [, , vw, vh] = vb.split(/\s+/).map((v) => Number(v))
  const width = vw || 960
  const height = vh || 600

  if (document?.fonts?.ready) {
    try { await document.fonts.ready } catch {}
  }

  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  const img = new Image()
  const imgLoaded = new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })
  img.src = url
  await imgLoaded

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    URL.revokeObjectURL(url)
    return
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.drawImage(img, 0, 0)

  URL.revokeObjectURL(url)

  canvas.toBlob((blob) => {
    if (!blob) return
    downloadBlob(blob, `knowledge-graph-${stamp()}.png`)
  }, 'image/png')
}

async function downloadPPT() {
  const svgText = exportSvgString()
  if (!svgText) return

  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'AssistDoctor'

  const slide = pptx.addSlide()
  slide.background = { color: 'FFFFFF' }

  slide.addText('医疗实体关系图', {
    x: 0.6,
    y: 0.35,
    w: 12.1,
    h: 0.5,
    fontFace: '微软雅黑',
    fontSize: 22,
    bold: true,
    color: '0F172A',
  })

  // wide: 13.333 x 7.5 in
  // keep generous margin and maximize the diagram area
  slide.addImage({
    data: svgToDataUri(svgText),
    x: 0.55,
    y: 1.05,
    w: 12.25,
    h: 6.1,
  })

  await pptx.writeFile({ fileName: `knowledge-graph-${stamp()}.pptx` })
}
</script>

<template>
  <div class="knowledge-graph">
    <div class="graph-header">
      <div class="header-top">
        <div>
          <div class="header-badge">Knowledge Graph</div>
          <h2 class="header-title">医疗实体关系图</h2>
        </div>
        <div class="header-actions">
          <button class="dl-btn" type="button" @click="downloadPNG(4)">
            下载 PNG
          </button>
          <button class="dl-btn ghost" type="button" @click="downloadSVG">
            下载 SVG
          </button>
          <button class="dl-btn ghost" type="button" @click="downloadPPT">
            下载 PPT
          </button>
        </div>
      </div>
      <p class="header-desc">
        展示疾病、症状、检查、药物等医疗实体间的关联关系，悬停节点查看关联
      </p>
    </div>

    <div class="graph-canvas">
      <svg
        ref="svgRef"
        class="graph-svg"
        viewBox="0 0 960 600"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="kg-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#ffffff" />
          </linearGradient>
          <filter id="kg-shadow" x="-25%" y="-25%" width="150%" height="175%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000" flood-opacity="0.07" />
          </filter>
          <marker
            id="kg-arrow"
            viewBox="0 0 10 8"
            refX="9"
            refY="4"
            markerWidth="8"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 1 1 L 9 4 L 1 7 Z" class="arrow-head" />
          </marker>
          <radialGradient
            v-for="n in nodes"
            :key="'g-' + n.id"
            :id="'ng-' + n.id"
            cx="38%"
            cy="32%"
            r="72%"
          >
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" :stop-color="n.bg" />
          </radialGradient>
        </defs>

        <!-- Background -->
        <rect width="960" height="600" fill="url(#kg-bg)" rx="8" />

        <!-- Edges -->
        <g class="edges-layer">
          <g
            v-for="edge in edges"
            :key="edge.id"
            class="edge-group"
            :class="{ dimmed: !isEdgeConnected(edge) }"
          >
            <path
              :d="edge.path"
              fill="none"
              class="edge-line"
              marker-end="url(#kg-arrow)"
            />
            <g :transform="`translate(${edge.lx},${edge.ly})`">
              <text
                v-for="(line, i) in splitLabel(edge.label)"
                :key="i"
                :y="(i - (splitLabel(edge.label).length - 1) / 2) * 16"
                text-anchor="middle"
                dominant-baseline="central"
                class="edge-text"
              >
                {{ line }}
              </text>
            </g>
          </g>
        </g>

        <!-- Nodes -->
        <g class="nodes-layer">
          <g
            v-for="(node, idx) in nodes"
            :key="node.id"
            class="node-group"
            :class="{ dimmed: !isNodeConnected(node.id), active: hoveredNode === node.id }"
            :style="{ '--enter-delay': idx * 80 + 'ms' }"
            @mouseenter="hoveredNode = node.id"
            @mouseleave="hoveredNode = null"
          >
            <ellipse
              :cx="node.x"
              :cy="node.y"
              :rx="node.rx + 14"
              :ry="node.ry + 14"
              :fill="node.color"
              class="node-glow"
            />
            <ellipse
              :cx="node.x"
              :cy="node.y"
              :rx="node.rx"
              :ry="node.ry"
              :fill="`url(#ng-${node.id})`"
              :stroke="node.border"
              stroke-width="2"
              filter="url(#kg-shadow)"
              class="node-shape"
            />
            <text
              :x="node.x"
              :y="node.y + 1"
              text-anchor="middle"
              dominant-baseline="central"
              :fill="node.color"
              class="node-text"
            >
              {{ node.label }}
            </text>
          </g>
        </g>
      </svg>
    </div>

    <div class="graph-legend">
      <div
        v-for="n in nodes"
        :key="'l-' + n.id"
        class="legend-chip"
        :class="{ active: hoveredNode === n.id }"
        @mouseenter="hoveredNode = n.id"
        @mouseleave="hoveredNode = null"
      >
        <span class="legend-dot" :style="{ background: n.color }"></span>
        <span class="legend-label">{{ n.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.knowledge-graph {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ── Header ── */
.graph-header {
  padding: 0.85rem 1rem 0.65rem;
  border-bottom: 1px solid var(--color-border);
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.dl-btn {
  appearance: none;
  border: 1px solid transparent;
  background: var(--color-primary-gradient);
  color: #ffffff;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 650;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
  box-shadow: var(--shadow-primary);
  line-height: 1;
}

.dl-btn:hover {
  filter: saturate(1.03);
  transform: translateY(-1px);
}

.dl-btn:active {
  transform: translateY(0);
}

.dl-btn.ghost {
  background: transparent;
  color: var(--color-primary);
  border-color: var(--color-border);
  box-shadow: none;
}

.dl-btn.ghost:hover {
  background: var(--color-primary-soft);
  transform: translateY(-1px);
}

.header-badge {
  display: inline-block;
  padding: 2px 10px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-radius: 100px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-family: 'Times New Roman', 'Noto Sans SC', serif;
  margin-bottom: 0.45rem;
}

.header-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 0.2rem;
}

.header-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  line-height: 1.45;
}

/* ── Canvas ── */
.graph-canvas {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
}

.graph-svg {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-sm);
}

/* ── SVG internals ── */
.arrow-head {
  fill: #94a3b8;
}

/* Edges */
.edge-group {
  transition: opacity 0.35s ease;
}

.edge-group.dimmed {
  opacity: 0.1;
}

.edge-line {
  stroke: #94a3b8;
  stroke-width: 1.5;
  stroke-dasharray: 5 5;
  animation: edge-flow 2s linear infinite;
}

.edge-text {
  font-size: 13px;
  font-weight: 600;
  font-family: 'Times New Roman', 'Noto Sans SC', serif;
  fill: #475569;
  stroke: #ffffff;
  stroke-width: 4.2;
  paint-order: stroke;
  pointer-events: none;
  user-select: none;
}

@keyframes edge-flow {
  to {
    stroke-dashoffset: -10;
  }
}

/* Nodes */
.node-group {
  cursor: pointer;
  transition: opacity 0.35s ease;
  animation: node-enter 0.5s ease-out backwards;
  animation-delay: var(--enter-delay);
}

.node-group.dimmed {
  opacity: 0.15;
}

.node-glow {
  opacity: 0;
  transition: opacity 0.35s ease;
}

.node-group.active .node-glow {
  opacity: 0.13;
}

.node-shape {
  transition: stroke-width 0.25s ease;
}

.node-group.active .node-shape {
  stroke-width: 3;
}

.node-text {
  font-size: 18px;
  font-weight: 700;
  font-family: 'Times New Roman', 'Noto Sans SC', serif;
  pointer-events: none;
  user-select: none;
}

@keyframes node-enter {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ── Legend ── */
.graph-legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  border-top: 1px solid var(--color-border);
}

.legend-chip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 3px 10px;
  border-radius: 100px;
  cursor: pointer;
  transition: background 0.2s ease;
  border: 1px solid transparent;
}

.legend-chip:hover,
.legend-chip.active {
  background: var(--color-primary-soft);
  border-color: var(--color-border);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-weight: 500;
  font-family: 'Times New Roman', 'Noto Sans SC', serif;
}
</style>
