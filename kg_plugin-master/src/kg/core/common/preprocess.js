import { defaultRadius, defaultNodeColor, defaultNodeClass, defaultNodeCover, defaultNodeCoverClass, defaultNodeTextColor,
   defaultLinkColor, defaultLinkTextColor, defaultLinkClass, defaultLinkWidth, defaultLinkTextClass, 
   defaultNodeHoverClass, defaultNodeSelectingClass, defaultMenuItemClass, defaultSubMenuItemClass, 
   defaultMenuActiveClass, defaultMenuTextClass, defaultSubMenuTextClass } from './const'


function guid() {
  return Number(Math.random().toString().substr(3, 3) + Date.now()).toString(36);
}

function preprocess (nodes, links, menu) {
  let nodesAfterProcess = []
  let linksAfterProcess = []
  let menuAfterProcess = {}

  nodesAfterProcess = nodes.map(n => 
    Object.assign({
      name: '',
      r: defaultRadius,
      color: defaultNodeColor,
      textColor: defaultNodeTextColor,
      nodeClass: defaultNodeClass,
      nodeHoverClass: defaultNodeHoverClass,
      nodeSelectingClass: defaultNodeSelectingClass,
      cover: defaultNodeCover,
      hoverCover: false,
      coverClass:defaultNodeCoverClass
    }, n)
  )

  linksAfterProcess = links.map(l => {
    const relLinks = links.filter(i => {
      if ((i.source === l.source && i.target === l.target && l.id !== i.id) || 
        (i.source === l.target && i.target === l.source && l.id !== i.id)) {
          return true
      }
    })
    const pathCount = relLinks.length + 1
    let curIndex = -1
    for (const i of relLinks) {
      if (i.pathIndex !== undefined && i.pathIndex > curIndex) {
        curIndex = i.pathIndex
      }
    }
    l.pathIndex = ++curIndex
    l.pathCount = pathCount > 1 ? pathCount : 1

    return Object.assign({
      type: '',
      pathIndex: 0,
      pathCount: 1,
      color: defaultLinkColor,
      textColor: defaultLinkTextColor,
      linkClass: defaultLinkClass,
      textClass: defaultLinkTextClass,
      width: defaultLinkWidth  
    }, l)
  })

  
  for (const [k, v] of Object.entries(menu)) {
    menuAfterProcess[k] = v.map(m => {
      m = Object.assign({
        id: guid(),
        level: 1,
        size: 1,
        children: [],
        type: 'ltkg',
        menuClass: defaultMenuItemClass,
        menuHoverClass: '',
        menuTextClass: defaultMenuTextClass,
        menuActiveClass: defaultMenuActiveClass,
        subMenuClass: defaultSubMenuItemClass,
        subMenuHoverClass: '',
        subMenuTextClass: defaultSubMenuTextClass,  
      }, m)
      let sub = m.children.map(s =>
        Object.assign({
          id: guid(),
          level: 2,
          size: 1,
          menuClass: defaultMenuItemClass,
          menuHoverClass: '',
          menuTextClass: defaultMenuTextClass,
          menuActiveClass: defaultMenuActiveClass,
          subMenuClass: defaultSubMenuItemClass,
          subMenuHoverClass: '',
          subMenuTextClass: defaultSubMenuTextClass,
          event: null,
        }, s)
      )
      m.children = sub
      return m
    })
  }
  
  return {
    _nodes: nodesAfterProcess,
    _links: linksAfterProcess,
    _menu: menuAfterProcess
  }

}

export {preprocess}
