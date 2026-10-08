const SVG_ID = 'kg-cavnas'
const G_ID = 'kg-content'
const NODE_LAYER = 'nodes-layer'
const LINK_LAYER = 'links-layer'
const MENU_LAYER = 'menu-layer'
const NODE_PREFIX = 'node-circle'
const NODE_TEXT_PREFIX = 'node-text'

const CLICK = 0
const MOUSE_OVER = 1
const MOUSE_OUT = 2
const MOUSE_DOWN = 3
const MOUSE_UP = 4
const DBLCLICK = 5

const defaultRadius = 20
const defaultNodeColor = '#fff'
const defaultNodeTextColor = '#fff'
const defaultNodeClass = 'kg-node'
const defaultNodeHoverClass = 'node-hover'
const defaultNodeCover = 'https://s1.ax1x.com/2020/08/30/dqSJV1.png'
const defaultNodeCoverClass = 'node-image'
const defaultNodeSelectingClass = 'node-selecting'

const defaultLinkColor = '#ccc'
const defaultLinkTextColor = '#fff'
const defaultLinkClass = 'kg-link'
const defaultLinkTextClass = 'kg-link-text'
const defaultLinkWidth = 1


const defaultMenuItemClass = 'menu-item'
const defaultMenuActiveClass = 'menu-item-active'
const defaultSubMenuItemClass = 'sub-menu-item'
const defaultMenuTextClass = 'menu-text'
const defaultSubMenuTextClass = 'sub-menu-text'


/* 以下暂未处理优化，未进入文档 */
const LINK_DISTANCE = 0
const MANY_BODY_STRENGTH = 1
const COLLIDE_RADIUS = 2

const SINGLE_SELECT_STATE = 0
const MULTI_SELECT_STATE = 1


export {SVG_ID, G_ID, NODE_LAYER, LINK_LAYER, MENU_LAYER, NODE_PREFIX, NODE_TEXT_PREFIX}

export {LINK_DISTANCE, MANY_BODY_STRENGTH, COLLIDE_RADIUS, SINGLE_SELECT_STATE}

export {defaultRadius, defaultNodeColor, defaultNodeTextColor, defaultNodeClass, defaultNodeSelectingClass, defaultNodeHoverClass, defaultNodeCover, defaultNodeCoverClass,
  defaultLinkColor, defaultLinkTextColor, defaultLinkClass, defaultLinkWidth, defaultLinkTextClass,
  defaultMenuItemClass, defaultMenuTextClass, defaultSubMenuItemClass, defaultMenuActiveClass, defaultSubMenuTextClass}

export {CLICK, MOUSE_OVER, MOUSE_OUT, MOUSE_DOWN, MOUSE_UP, DBLCLICK}