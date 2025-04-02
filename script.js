/////////////////////////////////////////
//////////////// imports ////////////////
/////////////////////////////////////////

import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'

//////////////////////////////////////////////////
//////////////// graph definition ////////////////
//////////////////////////////////////////////////

async function loadMMD(...definitions) {
  // read corresponding files
  const results = await Promise.allSettled(definitions.map(
    filename => fetch(`mmd/${filename}.mmd`).then(r => r.ok ? r.text() : null)
  ))

  // concatenate contents
  const contents = results
    .filter(result => result.status === "fulfilled" && result.value)
    .map(result => result.value)
    .join("\n")

  return contents
}

const allGenres = new Set([
  "weaponry",
  "spell",
  "evasion",
  "crit",
  "health",
  "mech",
  "heal",
  "shield",
  "innerfire",
  "vulnerable",
  "frost",
  "toxin"
])

const allHeroes = new Set([
  "yukimura",
  "alicia",
  "merlina",
  "malachite",
  "moriatee",
  "james",
  "sylvie",
  "kay",
  "emrald",
  "jenny",
  "alloya",
  "wukong",
  "cull",
  "brynhild",
  "hellsing",
  "asuka",
  "jacquelyn",
  "mina",
  "samuel"
])

// by default, select all genres no hero
let filter = new Set(allGenres)

function filterMMD(mmd) {
  return mmd.split("\n").filter(line => keepMMDLinePredicate(line)).join("\n")
}

function keepMMDLinePredicate(line) {

  // is a transition
  const transition = line.includes("-->")

  // hero is present
  const hero =
    [...allHeroes].some(h => RegExp(`\\b${h}\\b`).test(line)) &&
    [...filter].some(h => RegExp(`\\b${h}\\b`).test(line))

  // genre of skill is present AND not a dual skill from an absent genre
  const genresToExclude = new Set([...allGenres].filter(e => !filter.has(e)))
  const genre =
    [...filter].some(g => RegExp(`\\b${g}\\b`).test(line)) &&
    ![...genresToExclude].some(g => RegExp(`\\b${g}\\b`).test(line))

  return !transition || hero || genre
}

//////////////////////////////////////////////
//////////////// svg handling ////////////////
//////////////////////////////////////////////

function fitGraphToPage(svg, g) {
    // viewport covers 100% of div
    svg.setAttribute("width", "100%")
    svg.setAttribute("height", "100%")

    // viewbox is the same screen size as viewport
    // we define viewbox "x y w h" from svg size
    const vp = g.getBBox({ fill: true, stroke: true, markers: true, clipped: true })
    const vb = {
      x: vp.x,
      y: vp.y,
      w: vp.width,
      h: vp.height
    }
    svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`)
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet")
}

function px2svg(svg, point) {
  const pointPx = new DOMPoint(point.x, point.y)
  const pointSvg = pointPx.matrixTransform(svg.getScreenCTM().inverse())
  return pointSvg
}

/////////////////////////////////////////
//////////////// panning ////////////////
/////////////////////////////////////////

function addControlPanning(svg) {
  let isDragging = false
  let startPointSvg = null
  let vb = svg.viewBox.baseVal

  // panning: grab
  svg.addEventListener('mousedown', function (e) {
    isDragging = true
    svg.style.cursor = 'grabbing'
    const cursorPx = { x: e.clientX, y: e.clientY }
    startPointSvg = px2svg(svg, cursorPx)
  })

  // panning: move
  svg.addEventListener('mousemove', function (e) {
    if (!isDragging) return
    const cursorPx = { x: e.clientX, y: e.clientY }
    const cursorSvg = px2svg(svg, cursorPx)
    const dx = cursorSvg.x - startPointSvg.x
    const dy = cursorSvg.y - startPointSvg.y
    vb.x -= dx
    vb.y -= dy
  })

  // panning: release
  svg.addEventListener('mouseup', function () {
    isDragging = false
    svg.style.cursor = 'grab'
  })

  // panning: auto release if out of bounds
  svg.addEventListener('mouseleave', function () {
    isDragging = false
    svg.style.cursor = 'grab'
  })
}

/////////////////////////////////////////
//////////////// zooming ////////////////
/////////////////////////////////////////

function addControlZooming(svg, g, state) {
  svg.addEventListener('wheel', function (e) {
    e.preventDefault()

    // zoom settings for user input
    const wheelFactor = 1.25
    const scaleFactor = e.wheelDeltaY < 0 ? wheelFactor : 1 / wheelFactor

    // get info
    const vb = svg.viewBox.baseVal
    const cursorPx = { x: e.clientX, y: e.clientY }
    const cursorSvg = px2svg(svg, cursorPx)

    // scale the viewbox while keeping cursor in place
    let dx = (cursorSvg.x - vb.x) * scaleFactor
    let dy = (cursorSvg.y - vb.y) * scaleFactor
    vb.x = cursorSvg.x - dx
    vb.y = cursorSvg.y - dy
    vb.width *= scaleFactor
    vb.height *= scaleFactor
  })
}

////////////////////////////////////////////
//////////////// main logic ////////////////
////////////////////////////////////////////

async function main() {

  // initialize
  mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' })

  // load graph definition
  const base = await loadMMD("header", "game")
  const lobby = await loadMMD(...allGenres, ...allHeroes)
  let mmd = base + filterMMD(lobby)
  mmd = mmd.replace(/ *%%.*/g, "") // remove comments

  // inject svg into html dom
  const { svg } = await mermaid.render('svg', mmd)
  const dom_div = document.querySelector('div#diagram')
  dom_div.innerHTML = svg
  const dom_svg = document.querySelector('div#diagram svg')
  const dom_g = document.querySelector("div#diagram svg g")

  // initialize viewbox to see entire graph
  fitGraphToPage(dom_svg, dom_g)

  // interactivity
  addControlPanning(dom_svg)
  addControlZooming(dom_svg)
}

// when dom is loaded execute js
document.addEventListener("DOMContentLoaded", main)
