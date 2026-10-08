import {d3, addNodes, removeNode} from '../graph/core'
import { G_ID, MENU_LAYER, MOUSE_OVER, MOUSE_OUT, CLICK } from '../common/const';
import { overMenu, addMenuEvent, outMenu, clickMenu } from '../events/menuEvents';
import { preprocess } from '../common/preprocess';


const menuData = {}

let menuLayerG = null

let focusNode = null

const innerGap = 5
const outerGap = 28

const setMenuData = function (nodeType, menu) {
  menuData[nodeType] = menu
  menu.forEach(m => {
    addMenuEvent(m.type, MOUSE_OVER, (d, type) => { 
      d3.selectAll('.' + d.data.subMenuClass + '-container').classed('dashOut', true);
      const subMenu = menuData[focusNode.type].filter(m => m.type === type)[0].children
      getSecondMenu(d, type, subMenu)
      d3.select(event.target).classed(d.data.menuActiveClass, true);
    })
    addMenuEvent(m.type, MOUSE_OUT, (d, type) => { 
      d3.select(event.target).classed(d.data.menuActiveClass, false); // 鼠标移上的hover样式移除
    })
    if (m.event !== null) {
      addMenuEvent(m.type, CLICK, (d, type) => {
        if (!m.event)
          return

        if (m.event.type === 'add') {      
          m.event.source().then(res => {
            let target = Object.assign({
              nodes: [],
              links: [],
              menu: {}
            }, res)
            let {nodes, links, menu} = target
            const{_nodes, _links, _menu} = preprocess(nodes, links, menu)
            addNodes(_nodes, _links)
            for (const [k, v] of Object.entries(_menu)) {
              setMenuData(k, v)
            }
          })
        } else if (m.event.type === 'del') {      
          m.event.source().then(res => {
            removeNode(focusNode.id)
            focusNode = null
          })
        }
      })
    }

    m.children.forEach(s => {
      if (s.event !== null) {
        addMenuEvent(s.type, CLICK, (d, type) => {
          if (!s.event)
            return
          if (s.event.type === 'add') {      
            s.event.source().then(res => {
              let target = Object.assign({
                nodes: [],
                links: [],
                menu: {}
              }, res)
              let {nodes, links, menu} = target
              const{_nodes, _links, _menu} = preprocess(nodes, links, menu)
              addNodes(_nodes, _links)
              for (const [k, v] of Object.entries(_menu)) {
                setMenuData(k, v)
              }
            })
          } else if (s.event.type === 'del') {
            console.log(focusNode)
            s.event.source().then(res => {
              console.log(focusNode)
              removeNode(focusNode.id)
              focusNode = null
            })
          }
        })
      }
      
      addMenuEvent(s.type, MOUSE_OUT, (d, type) => { 
        // console.log(s)
      })
    })
  })
}

const getMenuData = function (nodeType) {
  return menuData[nodeType] ? menuData[nodeType] : []
}

const getSecondMenu = function (d, type, subMenu) {
  if (d3.selectAll(`#sub-menu${type}`)._groups[0].length > 0) {
    d3.selectAll(`#sub-menu${type}`).classed('dashOut', false);
  } else {
    // 如果没有，则创建, 建立角度比例尺
    const angleScale = d3.scaleLinear()
      .domain([0, 2 * Math.PI])
      .range([d.startAngle, d.endAngle]);
    let pieMenuData = subMenu
  
    generateMenu({
      innerR: focusNode.r + 35,
      outerR: focusNode.r + 65,
      startAngle: l => angleScale(l.startAngle),
      endAngle: l => angleScale(l.endAngle) 
    }, pieMenuData, `sub-menu${type}`);
  }
}

const generateMenu = function ({ innerR = 25, outerR = 60, startAngle = d => d.startAngle, endAngle = d => d.endAngle } = {}, menuDataSrc = [], id) {
  const arc = d3.arc()
    .innerRadius(innerR)
    .outerRadius(outerR)
    .padAngle(0)
    .startAngle(startAngle)
    .endAngle(endAngle)

  const pie = d3.pie()
  const arcsData = pie.value(d => d.size)(menuDataSrc)

  if (d3.selectAll('#' + MENU_LAYER).size() === 0) {
    menuLayerG = d3.select('.' + G_ID)
      .append('g')
      .attr('id', MENU_LAYER)
  }

  const g = menuLayerG.append('g')

  const arcs = g.selectAll('g')
    .data(arcsData)
    .enter()
    .append('g')

  if (id) {
    g.attr('class', 'sub-'+ MENU_LAYER + ' ' + 'sub-menu-item-container').attr('id', id)
    arc.padAngle(0.01)

    arcs.append('path')
      .attr('class', d =>  d.data.subMenuClass)
      .attr('d', arc)
      .on('mouseover', (d) => {
        overMenu(d)
        d3.event.stopPropagation()
      })
      .on('click', d => {
        clickMenu(d)
        removeMenu()
        d3.event.stopPropagation()
      });

    arcs.append('text')
      .text(d => d.data.name)
      .attr('text-anchor', 'middle')
      .attr('class', d => d.data.subMenuTextClass)
      .attr('x', d => arc.centroid(d)[0] * 1)
      .attr('y', d => arc.centroid(d)[1] * 1)
  } else {
    g.attr('class', 'main-'+ MENU_LAYER)
    arcs.append('path')
      .attr('class', d => d.data.menuClass)
      .attr('d', arc)
      .on('mouseover', d => {
        overMenu(d)
        d3.event.stopPropagation()
      })
      .on('mouseout', d => {
        outMenu(d)
        d3.event.stopPropagation()
      })
      .on('click', d => {
        clickMenu(d)
        removeMenu()
        d3.event.stopPropagation()
      })
    
    if (false) {
    // if (configDriver.ifUseMenuIcon()) {
      arcs.append('image')
      .attr('xlink:href', (d) => {
        return configDriver.getMenuIcon(d.data.option);
      })
      .attr('width', '20')
      .attr('height', '20')
      .attr('class', 'ArcImage')
      .attr('pointer-events', 'none')
      .attr('x', d =>
      (arc.centroid(d)[0] * 1) - 10)
      .attr('y', d =>
      (arc.centroid(d)[1] * 1) - 10);
    } else {
      arcs.append('text')
      .attr('class', d => d.data.menuTextClass)
      .attr('text-anchor', 'middle')
      .attr('transform', d => {
        const deg = (d.startAngle + d.endAngle) * 180/ (2 * Math.PI);
        if ( deg < 90 || deg > 270) {
          return 'rotate('+ deg +', '+(arc.centroid(d)[0])+' '+(arc.centroid(d)[1])+ ')'
        } else {
          return 'rotate('+ (deg + 180) +', '+(arc.centroid(d)[0])+' '+(arc.centroid(d)[1])+ ')'
        }
      })
      .attr('x', d => (arc.centroid(d)[0]))
      .attr('y', d => (arc.centroid(d)[1]))
      .text(d => d.data.name)
    }
  }
}


const removeMenu = () => {
  d3.selectAll('#' + MENU_LAYER).remove()
}

const placeMenu = (x, y) => {
  d3.selectAll('#' + MENU_LAYER).attr('transform', `translate(${x}, ${y})`);
}


const getMenu = function (d) {
  const {x, y} = d
  removeMenu()
  let menuData = getMenuData(d.type)
  focusNode = d
  
  const innerR = d.r + innerGap
  const outerR = innerR + outerGap
  
  generateMenu({ innerR, outerR, startAngle: a => a.startAngle, endAngle: a => a.endAngle }, menuData);
  placeMenu(x, y);
}

export {getMenu, setMenuData, removeMenu}
