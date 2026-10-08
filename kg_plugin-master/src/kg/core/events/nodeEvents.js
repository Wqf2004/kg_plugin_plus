const { CLICK, MOUSE_OVER, MOUSE_OUT, MOUSE_DOWN, MOUSE_UP, DBLCLICK, NODE_PREFIX } = require("../common/const")
import { d3 } from '../graph/core'
import { getMenu } from '../menu/menu'

const nodeEventPool = []

const addNodeEvent = (trigger, handler) => {
  nodeEventPool.push({
    trigger,
    handler
  })
}

const clickNode = d => {
  nodeEventPool.filter(i => i.trigger === CLICK).forEach(i => i.handler(d))
}

const dblclickNode = d => {
  nodeEventPool.filter(i => i.trigger === DBLCLICK).forEach(i => i.handler(d))
}

const overNode = d => {
  nodeEventPool.filter(i => i.trigger === MOUSE_OVER).forEach(i => i.handler(d))
}

const outNode = d => {
  nodeEventPool.filter(i => i.trigger === MOUSE_OUT).forEach(i => i.handler(d))
}

const downNode = d => {
  nodeEventPool.filter(i => i.trigger === MOUSE_DOWN).forEach((i) => i.handler(d))
}

const upNode = d => {
  nodeEventPool.filter(i => i.trigger === MOUSE_UP).forEach((i) => i.handler(d))
}

addNodeEvent(MOUSE_OVER, d => {
  d3.select(`#${NODE_PREFIX}_${d.id}`)
    .classed(d.nodeHoverClass, true)
  d3.select(this)
    .attr('xlink:href', d => d.hoverCover ? d.hoverCover : d.cover);
})

addNodeEvent(MOUSE_OUT, d => {
  d3.select(`#${NODE_PREFIX}_${d.id}`)
    .classed(d.nodeHoverClass, false)
  d3.select(this)
    .attr('xlink:href', d => d.cover)
})

addNodeEvent(MOUSE_DOWN, d => {
  d.fx = d.x
  d.fy = d.y
  d3.event.stopPropagation()
})

addNodeEvent(MOUSE_UP, d => {
  if (d3.event.button === 2) {
    getMenu(d);
  }
  d3.event.stopPropagation();
})

addNodeEvent(CLICK, d => {
  d3.event.stopPropagation()
})

addNodeEvent(DBLCLICK, d => {
  if (d3.event.button === 0) {
    d3.select(`#${NODE_PREFIX}_${d.id}`)
      .classed(d.nodeSelectingClass + ' selecting', true)
  }
  d3.event.stopPropagation()
})

export {clickNode, dblclickNode, overNode, outNode, downNode, upNode, addNodeEvent}
