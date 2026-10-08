import * as d3 from '../../dependency/d3.v5.js'

import { SVG_ID, CLICK, G_ID, LINK_LAYER, NODE_LAYER, MENU_LAYER, NODE_PREFIX, NODE_TEXT_PREFIX } from '../common/const.js'

import { addCanvasEvent, clickCanvas } from '../events/canvasEvents.js'
import { addNodeEvent } from '../events/nodeEvents'
import { zoom, zoomStart, zooming, zoomEnd } from '../events/zoom.js'
import { overNode, outNode, downNode, upNode, clickNode, dblclickNode } from '../events/nodeEvents'
import { drag, dragstarted, dragged, dragended } from '../events/drag.js'

import {drawLink, getLinkTextPosition} from './link'
import { preprocess } from '../common/preprocess.js'
import { setMenuData } from '../menu/menu.js'
import { delLinkByNode } from './utils'

import '../common/main.css'


let nodes = []
let links = []

let nodeParts, linkParts

let simulation

let containerBox = null
let containerID = ''
let width = 0
let height = 0

let svg = null
let contentbBody, nodesLayer, linksLayer

let settings = {}


const init = (dom) => {
  containerBox = dom
  width = dom.clientWidth
  height = dom.clientHeight
  containerID = dom.id
}

const createLayout = () => {
  svg = d3.select('#' + containerID)
    .attr('oncontextmenu', () => 'self.event.returnValue=false')
    .append('svg')
    .attr('id', SVG_ID)
    .attr('class', SVG_ID)
    .attr('width', width)
    .attr('height', height)

  svg.on('click', clickCanvas)

  svg.call(zoom
     .scaleExtent([1 / 8, 4])
     .on('start', zoomStart)
     .on('zoom', zooming)
     .on('end', zoomEnd))
     .on('dblclick.zoom', null)

  contentbBody = svg.append('g')
                    .attr('class', G_ID)

  contentbBody.append('g')
              .attr('id', LINK_LAYER);
  contentbBody.append('g')
              .attr('id', NODE_LAYER);
  nodesLayer = d3.select('#' + NODE_LAYER);
  linksLayer = d3.select('#' + LINK_LAYER);
}

const createSimulation = function () {
  const {linkDistance, manyBodyStrength, collideRadius} = settings
  function ticked() {
    if (nodeParts) {
      nodeParts.selectAll('circle')
               .attr('cx', d => parseFloat(d.x))
               .attr('cy', d => parseFloat(d.y));
      nodesLayer.selectAll('.image')
                .attr('x', d => d.x - d.r)
                .attr('y', d => d.y - d.r);
      nodesLayer.selectAll('text')
                .style('pointer-events', 'none')
                .attr('x', d => d.x)
                .attr('y', d => d.y);
      linksLayer.selectAll('path')
                .attr('d', d => drawLink(d))
                // .attr('d', d => selectPath(d).outline(selectPath(d).textWidth(d)))
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
      linksLayer.selectAll('g')
                .attr('transform', (d) => {
                  const dx = d.target.x - d.source.x;
                  const dy = d.target.y - d.source.y;
                  const angle = (((Math.atan2(dy, dx) / Math.PI) * 180) + 360) % 360;
                  d.naturalAngle = d.target.id === d.startNode ? (angle + 180) % 360 : angle;
                  return `translate(${d.source.x} ${d.source.y}) rotate(${d.naturalAngle})`;
                });
      // 给文字添加transform，达到左右旋转后文字自动改变方向的效果
      linksLayer.selectAll('text')
                .style('pointer-events', 'none')
                .attr('x', d => getLinkTextPosition(d).x)
                .attr('y', (d) => {
                  // const arc = selectPath(d);
                  const textY = getLinkTextPosition(d).y
                  const dx = d.target.x - d.source.x;
                  const dy = d.target.y - d.source.y;
                  const angle = (((Math.atan2(dy, dx) / Math.PI) * 180) + 360) % 360;
                  d.naturalAngle = d.target.id === d.startNode ? (angle + 180) % 360 : angle;
                  if (d.naturalAngle < 90 || d.naturalAngle > 270) {
                    return textY;
                    // return arc.textpos_y();
                  }
                  return textY - 60;
                  // return arc.textpos_y() - 60;
                })
                .attr('transform', (d) => {
                  // const arc = selectPath(d);
                  const textPos = getLinkTextPosition(d)
                  const dx = d.target.x - d.source.x;
                  const dy = d.target.y - d.source.y;
                  const angle = (((Math.atan2(dy, dx) / Math.PI) * 180) + 360) % 360;
                  d.naturalAngle = d.target.id === d.source.id ? (angle + 180) % 360 : angle;
                  if (d.naturalAngle < 90 || d.naturalAngle > 270) {
                    return null;
                  }
                  return `rotate(180 ${textPos.x} ${textPos.y})`;
                });
    }  
  }
  simulation = d3.forceSimulation()
                 .force('x', d3.forceX(width / 2).strength(0.05))
                 .force('y', d3.forceY(height / 2).strength(0.05))
                 .force('link', d3.forceLink().distance(linkDistance).id(d => d.id))
                 .force('charge', d3.forceManyBody().strength(manyBodyStrength))
                 .force('collide', d3.forceCollide(collideRadius))
                 .on('tick', ticked)
}

const updateLayout = function () {
  const updateNode = nodesLayer.selectAll('g').data(nodes, d => d.id + d.index)
  updateNode.exit().remove()
  nodeParts = updateNode.enter().append('g')
  nodeParts
    .append('circle')
    .attr('class', d => d.nodeClass)
    .attr('id', d => `${NODE_PREFIX}_${d.id}`)
    .attr('r', d => d.r)
    .style('fill', d => d.color)
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)

  nodeParts
    .append('image')
    .attr('xlink:href', d => d.cover)
    .attr('class', d => 'image ' + d.coverClass)
    .attr('r', d => d.r)
    .attr('width', d => 2 * d.r)
    .attr('height', d => 2 * d.r)
    .attr('x', (d) => (!d.x || isNaN(d.x)) ? 0 : d.x - d.r)
    .attr('y', (d) => (!d.y || isNaN(d.y)) ? 0 : d.y - d.r)
    .on('mouseover', overNode)
    .on('mouseout', outNode)
    .on('mousedown', downNode)
    .on('mouseup', upNode)
    .on('click', clickNode)
    .on('dblclick', dblclickNode)
    .call(drag
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended))

  nodeParts
    .append('text')
    // .attr('class', `${NODE_TEXT_PREFIX}`)
    .attr('id', d => `${NODE_TEXT_PREFIX}_${d.id}`)
    .style('fill', d => d.textColor)
    .attr('text-anchor', 'middle')
    .attr('x', d => (!d.x || isNaN(d.x)) ? d.r : d.x + d.r)
    .attr('y', d => (!d.y || isNaN(d.y)) ? d.r : d.y + d.r)
    .attr('dx', () => 0)
    .attr('font-size', '12px')
    .attr('dy', d =>  `${d.r + 14}px`)
    .text(d => d.name)
  nodeParts = nodeParts.merge(updateNode)


  const updateLink = linksLayer.selectAll('g').data(links, d => d.id + d.index)
  updateLink.exit().remove()
  linkParts = updateLink.enter().append('g');
  linkParts.append('path')
    .attr('class', d => d.linkClass)
    .attr('p-i', d => d.pathIndex)
    .style('stroke', d => d.color)
    .style('stroke-width', d =>d.width)
    .style('fill', d => d.color)

  linkParts
    .append('text')
    .attr('class', d => d.textClass)
    .attr('id', d => `linkText_${d.id}`)
    .style('fill', d => d.textColor)
    .attr('text-anchor', 'middle')
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .attr('dx', () => 0)
    .attr('font-size', '10px')
    .attr('dy', '3.2em')
    .on('mouseover', d => {
      d3.event.stopPropagation();
    })
    .text(d => d.type);
  linkParts = linkParts.merge(updateLink);

  simulation.nodes(nodes);
  simulation.force('link').links(links);
  simulation.alpha(1).alphaMin(0.05).restart();
}

const addNodes = function (newNodes, newLinks) {
  newNodes.forEach((e) => {
    if (!nodes.find(z => z.id === e.id)) {
      nodes.push(e)
    }
  })
  newLinks.forEach((e) => {
    if (!links.find(z => z.id === e.id)) {
      links.push(e)
    }
  })
  updateLayout();
}

const removeNode = function (nodeId) {
  d3.selectAll('#' + MENU_LAYER).remove()
  nodes.find((val, ind, arr) => {
    if (val.id === nodeId) {
      arr.splice(ind, 1)
      return true
    }
    return false
  });

  delLinkByNode(links, nodeId)
  updateLayout()
}

const start = function (startNodes = nodes, startLinks = links) {
  nodes.splice(0)
  links.splice(0)
  nodes.push(...startNodes)
  links.push(...startLinks)
  if (svg === null) {
    createLayout()
    createSimulation()
  }
  updateLayout()
}

const setOption = function (opt) {
  settings = Object.assign({
    'linkDistance': 170,
    'manyBodyStrength': -100,
    'collideRadius': 30,
    'nodes': [],
    'links': [],
    'dragLock': false,
    'menu': {},
    'events': {}
  }, opt)
  const {_nodes, _links, _menu} = preprocess(settings.nodes, settings.links, settings.menu)

  for (const [k, v] of Object.entries(_menu)) {
    setMenuData(k, v)
  }

  for (const [k, v] of Object.entries(settings.events)) {
    if (k === 'canvas') {
      for (const i of v) {
        if (i.type === 'click') {
          addCanvasEvent(CLICK, e => i.method(e))
        }
      }
    } else if (k === 'node') {
      for (const i of v) {
        if (i.type === 'click') {
          addNodeEvent(CLICK, e => i.method(e))
        }
      }
    }
  }
  start(_nodes, _links)
}
export {d3}

export {simulation}

export {contentbBody, svg, linksLayer, nodeParts, nodesLayer, settings}

export {init, setOption, addNodes, removeNode, preprocess}
