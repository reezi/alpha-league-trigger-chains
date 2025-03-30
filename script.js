/////////////////////////////////////////
//////////////// imports ////////////////
/////////////////////////////////////////

import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'

//////////////////////////////////////////////////
//////////////// graph definition ////////////////
//////////////////////////////////////////////////

async function getMMD() {
  let mmd
  try {
    const response = await fetch("game.mmd") // from file
    if (!response.ok) throw new Error(`error http ${response.status} https://http.cat/${response.status}`);
    mmd = await response.text()
  } catch (error) {
    console.error("Error loading Mermaid diagram:", error)
    mmd = "failed to load diagram"
  }
  return mmd
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

/////////////////////////////////////////
//////////////// panning ////////////////
/////////////////////////////////////////

function addControlPanning(svg) {
  let isDragging = false
  let startX, startY
  let vb = svg.viewBox.baseVal

  // panning: grab
  svg.addEventListener('mousedown', function (e) {
    isDragging = true
    startX = e.clientX
    startY = e.clientY
    svg.style.cursor = 'grabbing'
  })

  // panning: move
  svg.addEventListener('mousemove', function (e) {
    if (!isDragging) return

    let dx = (startX - e.clientX)
    let dy = (startY - e.clientY)

    vb.x += dx
    vb.y += dy

    startX = e.clientX
    startY = e.clientY
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

////////////////////////////////////////////
//////////////// main logic ////////////////
////////////////////////////////////////////

async function main() {

  // initialize
  mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' })

  // mmd2svg
  let mmd = await getMMD()
  const { svg } = await mermaid.render('svg', mmd)

  // inject svg into html dom
  const dom_div = document.querySelector('div#diagram')
  dom_div.innerHTML = svg
  const dom_svg = document.querySelector('div#diagram svg')
  const dom_g = document.querySelector("div#diagram svg g")

  // initialize viewbox to see entire graph
  fitGraphToPage(dom_svg, dom_g)

  // interactivity
  addControlPanning(dom_svg)
}

// when dom is loaded execute js
document.addEventListener("DOMContentLoaded", main)
