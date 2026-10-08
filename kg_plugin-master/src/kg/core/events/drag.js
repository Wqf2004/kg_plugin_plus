import {d3, simulation, settings} from '../graph/core'
import {MENU_LAYER} from '../common/const'

const drag = d3.drag();
drag.filter(() => !d3.event.button)

function dragstarted() {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart()
  d3.selectAll('#' + MENU_LAYER).remove()
  d3.event.subject.fx = d3.event.subject.x
  d3.event.subject.fy = d3.event.subject.y
  d3.event.subject.active = true
}

function dragged() {
  d3.event.subject.fx = d3.event.x
  d3.event.subject.fy = d3.event.y
}

function dragended() {
  if (!d3.event.active) simulation.alphaTarget(0);
  if (!settings.dragLock) { // 无拖动锁，不固定
    d3.event.subject.fx = null
    d3.event.subject.fy = null
  }
  d3.event.subject.active = false;
}

export {dragstarted, dragended, dragged, drag}