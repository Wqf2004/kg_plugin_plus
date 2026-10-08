import { CLICK, MOUSE_OVER, MOUSE_OUT, MOUSE_DOWN } from '../common/const'

const menuEventPool = []

const addMenuEvent = (type, trigger, handler) => {
  menuEventPool.push({
    type,
    trigger,
    handler
  })
}

const clickMenu = d => {
  menuEventPool.filter(i => i.trigger === CLICK && d.data.type === i.type)
    .forEach(i => i.handler(d, i.type))
}

const overMenu = d => {
  menuEventPool.filter(i => i.trigger === MOUSE_OVER && d.data.type === i.type)
    .forEach(i =>  i.handler(d, i.type))
}

const outMenu = d => {
  menuEventPool.filter(i => i.trigger === MOUSE_OUT && d.data.type === i.type)
    .forEach(i => i.handler(d, i.type))
}

const downMenu = d => {
  menuEventPool.filter(i => i.trigger === MOUSE_DOWN && d.data.type === i.type)
    .forEach(i => i.handler(d, i.type))
}


export {addMenuEvent, clickMenu, overMenu, outMenu, downMenu}
