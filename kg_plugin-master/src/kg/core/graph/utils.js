/**
 * 根据节点id，在links中查找相关连线并删除
 * @param {Object} links 
 * @param {Number} id 
 */
function delLinkByNode (links, id) {
  for (let i = links.length - 1; i >= 0; i -= 1) {
    if (links[i].source.id === id || links[i].target.id === id) {
      links.splice(i, 1);
    }
  }
}
/**
 * 根据节点id，在links中查找相关连线并作为参数传入method并执行
 * @param {Object} links 
 * @param {Number} id 
 * @param {Function} method 
 */
function operationLinkByNode (links, id, method) {
  for (let i = links.length - 1; i >= 0; i -= 1) {
    if (links[i].source.id === id || links[i].target.id === id) {
      method(links[i])
    }
  }
}

export {delLinkByNode, operationLinkByNode}
