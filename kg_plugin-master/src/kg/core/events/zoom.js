
import {contentbBody, svg, d3} from '../graph/core'

let currrentTransform = null

const zoom = d3.zoom()

function zoomStart() {
  // console.log('zoom start')
}
function zooming() {
  contentbBody.attr('transform', `translate(${d3.zoomTransform(this).x},${d3.zoomTransform(this).y}) scale(${d3.zoomTransform(this).k})`);
}
function zoomEnd() {
  currrentTransform = d3.zoomTransform(this)
}

export {zoom, zoomStart, zooming, zoomEnd}
