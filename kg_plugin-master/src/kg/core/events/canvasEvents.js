import {d3} from '../graph/core'
import { CLICK, MENU_LAYER } from '../common/const'

const canvasEventPool = []

const addCanvasEvent = (trigger, handler) => {
  canvasEventPool.push({
    trigger,
    handler
  })
}

const clickCanvas = (e) => {
  canvasEventPool.filter((i) => i.trigger === CLICK).forEach((i) => i.handler(e))
}

addCanvasEvent(CLICK, d => {
  d3.selectAll('#' + MENU_LAYER).remove()

  d3.selectAll('.selecting')
    .classed('selecting', false)
})

export {addCanvasEvent, clickCanvas}
