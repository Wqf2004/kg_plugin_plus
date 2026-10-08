# 我对这个项目的解读

## webpack.config.js

在当前目录（peakWen.md所在目录）下执行一下指令：

```bash
npx webpack

```

1. webpack 打包工具自动找 webpack.config.js

目前没有任何区别
path.resolve(__dirname, 'dist') # 解析成绝对路径
path.join(__dirname, 'dist')

于是我读懂了webpack.config.js文件中的内容，如下：
第一句代码中的require()：就是 CommonJS 模块导入语法
其中'path'：是 Node.js 官方内置的核心模块，不用 npm install 安装，装 Node.js 就自带
把引入的「路径工具模块」赋值给变量 path

后一整段用 module.exports 标识的花括号括起来的是 JS 中的对象（如果初学可以理解为 Python 中的字典 dict），它们也是 Node.js 环境里自带的
其中的内容是对导出进行配置：

- 入口文件（从哪里开始打包）entry
- 输出到哪里（导出为的文件名 filename 导出的位置 path）output：bundle.js
  - path.resolve(__dirname, 'dist') # 解析成绝对路径
- 打包模式（开发模式还是生产模式）mode 若为 development 产生 debug.log 日志文件
- 开发服务器配置（compress 表示是否压缩，port 表示开放的端口号）
- 怎么处理非 JS 资源等（test字段表示校验，即校验当前的文件后缀名是否为.css，如果是使用 use 字段中的数组 loader 对其进行处理）

注意：css文件一并打包进了 bundle.js 的输出文件中

1. css-loader 读取并解析 CSS
把所有样式内容、以及 CSS 里的 @import 引入的其他 CSS、url() 引入的图片，全部解析成纯文本内容
不会生成单独的 CSS 文件，只是把样式内容转成 JS 能处理的字符串
2. 第二步：style-loader 把 CSS 转成 JS 代码
把解析好的 CSS 纯文本，包装成一段可执行的 JS 代码
这段 JS 代码的作用是：浏览器运行时，自动在页面的 `<head>` 里创建一个 `<style>` 标签，把 CSS 内容塞进去
相当于把 CSS 变成了一段「动态插入样式的 JS 逻辑」
3. 第三步：全部打进 bundle.js
这段「动态插入样式的 JS 代码」，和你的业务 JS 代码、其他依赖，全部合并到 bundle.js 里
最终 dist 里只有 bundle.js 一个文件，没有单独的 .css 文件

## index.html

将 src 下的 JS 源代码和 CSS 资源打包后，放入到 dist 中
dist 下还有 index.html 文件：

dist/index.html 是整个项目的「浏览器入口页面」—— 浏览器第一个加载的就是这个文件，所有你打包好的 JS/CSS 代码，都必须通过它才能运行。

在 index.html 里的 `<head>` 标签下存在

```html
<script src="./bundle.js"></script>
```

将 CSS 样式和代码逻辑，导入到网页中显示或执行

此外还有一个 data.js 脚本，用来写需要加载的数据。

## src

### index.js

接下来我们从 index.js 出发逐步解析这个 src 源码文件夹

首先是

```js
import * as kg from './kg/core/graph/core'
```

从kg下的core下的graph中导入core的js中的所有对象，并使用kg标识
可以用 kg.xxx 访问目标模块导出的任何内容
在对应的core.js的末尾看到了

```js
export {d3}

export {simulation}

export {contentbBody, svg, linksLayer, nodeParts, nodesLayer, settings}

export {init, setOption, addNodes, removeNode}
```

接着是一个立即执行函数（IIFE，Immediately Invoked Function Expression）

```js
(function() {
  window.kg = kg
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = kg
  }
})()
```

提取出它的结构是

```js
(function() {
  // 内部代码
})()
```

其中 `function(){}` 部分对应着一个匿名函数，通过`()`调用这个函数，实现了立即执行

`window.kg = kg`把之前导入的 kg 模块对象，挂载到浏览器的 window 全局对象上。浏览器控制台直接输入 kg 就能访问，方便开发调试。

`module.exports = kg`导出，使之可以在index.html中被调用。

分析：打包的链路是靠import来完成，剩下的代码/指令需要等到程序真正开始运行时才形成调用关系。

### core.js

前面的 import 都是从外部导入依赖的包
按模块职责对这些依赖的包做一做分类：

```js
import * as d3 from '../../dependency/d3.v5.js'
```

是第三方基础依赖库，是整个图可视化的核心引擎

```js
import { SVG_ID, CLICK, G_ID, LINK_LAYER, NODE_LAYER, MENU_LAYER, NODE_PREFIX, NODE_TEXT_PREFIX } from '../common/const.js'
```

是全局常量配置层，统一管理所有硬编码的固定值，避免散落在各个文件里

下面是需要重点研究的部分（交互事件处理层）

```js
import { addCanvasEvent, clickCanvas } from '../events/canvasEvents.js'
```

用于处理画布空白区域的点击、右键等全局事件（画布全局事件）

```js
import { addNodeEvent, overNode, outNode, downNode, upNode, clickNode, dblclickNode } from '../events/nodeEvents'
```

用于处理节点的鼠标悬停、移出、点击、双击等节点专属交互（节点交互事件）

```js
import { zoom, zoomStart, zooming, zoomEnd } from '../events/zoom.js'
```

用于处理节点的拖拽移动交互，按住节点拖动位置（节点拖拽事件）

下面是**需要修改的部分（渲染逻辑层：图谱功能核心）**

```js
import {drawLink, getLinkTextPosition} from './link'
```

用于绘制节点之间的连线、计算连线上文字的位置（链路渲染）

```js
import { preprocess } from '../common/preprocess.js'
```

用于对原始图谱数据做清洗、格式转换、字段补全，转换成 D3 能渲染的格式

```js
import { setMenuData } from '../menu/menu.js'
```

用于配置节点 / 链路右键弹出菜单的内容、点击事件

```js
import { delLinkByNode } from './utils'
```

是业务工具函数

最后一个是全局样式文件

```js
import '../common/main.css'
```

下面看导出，主要以理解为主，暂不做开发

ds 导出后在其他脚本中被调用

simulation真正创建是在：

```js
simulation = d3.forceSimulation()
                 .force('x', d3.forceX(width / 2).strength(0.05))
                 .force('y', d3.forceY(height / 2).strength(0.05))
                 .force('link', d3.forceLink().distance(linkDistance).id(d => d.id))
                 .force('charge', d3.forceManyBody().strength(manyBodyStrength))
                 .force('collide', d3.forceCollide(collideRadius))
                 .on('tick', ticked)
```

通过d3的第三个方依赖实现，D3 力导向图（Force-Directed Graph）
simulation 是 D3 内置的物理力模拟器，它会模拟真实世界的「拉力、斥力、碰撞力」，自动计算每个节点的 x/y 坐标，让你的知识图谱节点自动散开、不重叠、链路自然拉伸，不用你手动给每个节点写死坐标。

- forceX / forceY：中心吸附力
- forceLink：链路拉力
- forceManyBody：节点斥力
- forceCollide：碰撞检测

在`createSimulation`的另一部分即`ticked`定义了一个函数
这个函数保证每过一帧的时间就会执行一次。
这个工具仅在drag.js中被用到

知识图谱中的核心状态/操作接口

```js
export {contentbBody, svg, linksLayer, nodeParts, nodesLayer, settings}
```

| 导出变量      | 是什么       | 导出后能做什么|
|--------------|--------------|--------------|
| `svg`        | 整个图谱的最外层 SVG 容器  在zoom.js中被使用，但未具体发挥作用   | 外部可以直接给 SVG 加样式、导出为图片、加全局事件                             |
| `contentbBody` | SVG 下的最外层分组   在zoom.js中被使用    | 所有节点、链路都在这个分组里，外部可以统一控制缩放、平移、显隐                 |
| `nodesLayer` | 节点图层（专门放所有节点） 未被使用       | 外部可以批量操作所有节点：比如批量改颜色、批量隐藏/显示节点、给节点加特效       |
| `linksLayer` | 链路图层（专门放所有连线的）   未被使用   | 外部可以批量操作所有链路：比如批量改连线粗细、颜色、隐藏某类连线               |
| `nodeParts`  | 当前所有节点的 D3 选择集       未被使用     | 外部可以直接操作单个节点：比如给某个节点加高亮、改某个节点的位置               |
|  `settings`     |  图谱的全局配置      在drag.js中被使用      |     外部可以读取 / 修改全局配置      |

`<g>` = SVG 分组容器作用：把一堆图形（节点、连线、文字）打包成一个组，统一控制：缩放、平移、显示 / 隐藏、样式（颜色、透明度）、动画。
这些内容： `<svg>`、`<g>`、节点、连线，全是 JS 运行后动态生成的。

```html
<div id="kg">
  <svg>
    <g class="graph-body">
      <g id="linksLayer"></g>
      <g id="nodesLayer"></g>
    </g>
  </svg>
</div>
```

下面是一个重点（包含了添加节点和删除节点）

```js
export {init, setOption, addNodes, removeNode}
```

| 导出API                  | 核心作用                     | 调用时机/使用场景   |
|--------------------------|------------------------------|--------------------|
| `init(dom)`          | 初始化图谱的挂载容器 在index.html中被通过kg调用     | 第一个必须调用的API，告诉图谱要**渲染到哪个DOM节点**上                                                                      |
| `setOption(opt)`     | 核心配置+初始化渲染接口  在index.html中被通过kg调用   | 传入节点数据、链路数据、布局参数，调用后会自动完成：1. 预处理数据2. 初始化物理引擎3. 渲染整个图谱是整个图谱的启动入口                                        |
| `addNodes(newNodes, newLinks)` | 动态新增节点+链路  真正的调用发生在menu.js   | 业务场景：用户点击节点「展开子节点」、搜索新增节点时调用，**无需重新渲染整个图谱**，仅增量新增节点，自动更新布局                                              |
| `removeNode(nodeId)`     | 动态删除节点   真正的调用发生在menu.js               | 业务场景：用户右键点击节点「删除」时调用，内部会自动完成：1. 删除目标节点2. 自动删除和该节点关联的所有链路3. 重启物理引擎更新布局         |

### link.js

```text
drawLink(链路数据d)
      ↓
判断是直线还是曲线：同节点对的中间链路用直线，其他用曲线
      ↓
1. 直线：调用 straightLink 生成直线路径
2. 曲线：调用 curveLink 生成曲线路径
      ↓
getLinkTextPosition 计算文字位置，把关系文字放在链路中间
      ↓
输出 SVG path 路径，交给 D3 渲染
```

数据从哪来？怎么做处理？

```js
const getLinkDesc = d => {
  const {source, target} = d // 源节点、目标节点（从simulation拿到的实时坐标）
  // 1. 计算两个节点中心的直线距离
  const centerDistance = Math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
  // 2. 计算两个节点边缘之间的距离（减去两个节点的半径）
  const gapDistance = centerDistance - r1 - r2
  // 3. 减去箭头长度后的链路有效长度
  const noArrowGapDis = gapDistance - arrowStyle.size
  // 4. 计算曲线的偏转量：不同序号的链路有不同的弯曲方向和程度，避免重叠
  const deflection = realDeflectionStep * (d.pathIndex - middleIndex) * dir
  return { /* 所有基础参数 */ }
}
```

该功能在 core/createSimulation/ticked/linksLayer 中被调用

### utils.js

导出的

```js
export {delLinkByNode, operationLinkByNode}
```

暂时只有 delLinkByNode 在 core/removeNode 中被调用，operationLinkByNode 暂未被调用。

### menu.js

直接看导出的三个函数

```js
export {getMenu, setMenuData, removeMenu}
```

- setMenuData(nodeType, menu) —— 菜单配置注册接口 在core/setOptin中被调用
- getMenu(d) —— 菜单渲染触发接口 在addNodeEvent(MOUSE_UP)中被调用
- removeMenu() —— 菜单销毁接口 在内部调用
  调用时机
  这三个场景下都会调用：
  - 点击菜单项完成操作后（比如点击删除节点后自动关闭菜单）
  - 点击画布空白处（取消菜单）
  - 鼠标移出菜单区域（自动关闭菜单）

### const.js

主要看一下未进入文档的几个常量

```js
const LINK_DISTANCE = 0
const MANY_BODY_STRENGTH = 1
const COLLIDE_RADIUS = 2
```

对应 core/setOption 里，力导向的三个参数（链路距离、斥力大小、碰撞半径）是直接传值的，这三个常量是用来做 **「参数配置的 key 映射」** 的，后续可以做的功能有：

1. 做一个可视化的参数调节面板，用户可以拖动滑块调节链路距离、节点斥力、碰撞半径
2. 做参数的统一管理和持久化，用这些常量当配置的 key，避免硬编码

```js
const SINGLE_SELECT_STATE = 0
const MULTI_SELECT_STATE = 1
```

现在的项目只支持「单节点点击 / 操作」，这两个常量是为 **「节点多选 / 框选功能」** 预留的：
SINGLE_SELECT_STATE：单选模式，一次只能选一个节点
MULTI_SELECT_STATE：多选模式，支持按住 Ctrl 点选多个节点、拖动鼠标框选多个节点，批量操作（批量删除、批量修改颜色、批量导出）

### main.css

这是知识图谱的节点交互 + 右键环形菜单的样式配置，核心效果可以简单总结为：

- 节点样式：节点默认带半透明白边框，hover 时边框平滑变粗（5px）；选中节点会触发「边框闪烁 / 虚线旋转」的高亮动画，突出选中状态
- 环形菜单样式：主菜单为蓝紫色、子菜单为绿色，弹出时自带「线条逐渐绘制」的展开动画；hover 时菜单会平滑变亮，菜单文字为白色小字体，不阻挡菜单点击
- 交互动效：菜单关闭时会平滑淡出隐藏，不会生硬消失

### preprocess.js

导出的 `preprocess`在 core/setOption 和 menu/setMenuData 中被调用

```js
function preprocess (nodes, links, menu) {
  let nodesAfterProcess = []
  let linksAfterProcess = []
  let menuAfterProcess = {}
  ...
}
```

它会同时处理三类核心数据，每一类的处理逻辑都对应渲染层的需求

1. 节点数据预处理：通过默认参数兜底补全所有缺省字段
2. 链路数据预处理：计算多链路布局参数（统计当前两个节点之间的总链路数）
3. 菜单数据预处理：标准化菜单配置 + 生成唯一 ID

### events

#### canvasEvents.js

外部可以通过 addCanvasEvent 灵活扩展画布点击行为，点击画布时会自动执行所有注册的回调，同时默认实现了「点击空白处关闭菜单、取消节点选中」的基础交互。

### menuEvents.js

实现了按菜单项类型隔离的事件注册和分发（filter 过滤出我这个函数执行的事件），点击 / 悬停菜单项时自动执行对应类型的回调，和画布事件池是统一的架构设计，让菜单事件的管理更灵活、更易维护。

在 setMenuData 里给每个菜单项绑定事件，就是调用 addMenuEvent 注册，点击菜单项时就会执行你注册的回调（比如添加节点、删除节点）。

### drag.js

支持左键拖动节点，拖动时节点固定跟随鼠标，拖动结束后可选择释放节点让它继续参与物理模拟，或者固定在拖动后的位置，同时避免和右键菜单冲突，是知识图谱最核心的基础交互之一。

### zoom.js

利用 D3 内置的 zoom 行为处理鼠标事件，通过修改最外层 SVG 分组的 transform 变换，实现整个图谱的高效缩放和平移，是可视化项目最核心的基础交互之一。

[End]
time: 2026/5/12

## 彻底探究节点添加的过程

@/dist\index.html
```
{name: '前端', type: 'front', event: {type: 'add', source: addNodes} },
```
这里注册了一个add类型的menu，其source为addNodes

对应的addNodes在@/dist\data.js
```
const addNodes = () => {
  const response = {
    nodes: [
      {id: 6, type: 'js', name: 'js', r: 20, color: 'white', cover: 'https://s1.ax1x.com/2020/08/31/dXyb0s.th.png'},
      {id: 7, type: 'css', name: 'css', r: 20, color: 'white', cover: 'https://s1.ax1x.com/2020/08/31/dXDcmn.th.png'},
      {id: 8, type: 'html', name: 'HTML', r: 20, color: 'white', cover: 'https://s1.ax1x.com/2020/08/31/dXDPiT.png'}
    ],
    links: [
      {id: 9, source: 1, type: '前端技术', target: 6},
      {id: 10, source: 1, type: '前端技术', target: 7},
      {id: 11, source: 1, type: '前端技术', target: 8}
    ],
    menu: {
      'js': [
        {name: '删除节点', type: 'del', event: {
          type: 'del', source: delPromise
        }},
        {name: 'nodeJS', type: 'nodejs'},
        {name: 'jquery', type: 'jquery'},
        {name: '技术框架', type: 'frame', children: [
         {name: 'vue', type: 'vue', event: {
          type: 'add', source: vueBaseNodes
         }},
         {name: 'React', type: 'react'},
         {name: 'Angular', type: 'angular'},
        ]}, 
      ]
    }
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(response)
    }, 100)
  })
}
```

add类型定义在@/src\kg\core\menu\menu.js
```
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
```

## 节点添加过程中 Link 关联的实现机制分析

基于代码分析，以下是节点添加过程中 link 关联的完整实现流程：

---

### 一、整体流程概览

```
用户点击菜单项
      ↓
menu.js 中的 CLICK 事件处理
      ↓
调用 m.event.source() 获取 Promise
      ↓
preprocess 预处理 links 数据
      ↓
addNodes(_nodes, _links) 添加节点和链路
      ↓
updateLayout() 更新布局
      ↓
D3 forceLink 建立节点关联
```

---

### 二、Link 关联的核心实现（重点）

#### 1. 数据定义层（`dist/data.js`）

```javascript
links: [
  {id: 9, source: 1, type: '前端技术', target: 6},
  // source: 1 → 源节点ID（互联网技术节点）
  // target: 6 → 目标节点ID（js节点）
]
```

**关键点**：link 通过 `source` 和 `target` 字段引用节点 ID，而非直接引用节点对象。

#### 2. 预处理层（`preprocess.js` 第31-58行）

```javascript
linksAfterProcess = links.map(l => {
  // 统计相同节点对之间的链路数量（处理多链路情况）
  const relLinks = links.filter(i => {
    if ((i.source === l.source && i.target === l.target && l.id !== i.id) || 
        (i.source === l.target && i.target === l.source && l.id !== i.id)) {
      return true
    }
  })
  // 计算 pathIndex 和 pathCount 用于多链路弯曲绘制
  const pathCount = relLinks.length + 1
  l.pathIndex = ++curIndex
  l.pathCount = pathCount > 1 ? pathCount : 1
  
  return Object.assign({/* 默认值 */}, l)
})
```

**作用**：补全 link 的默认属性，并计算多链路布局参数（避免同一节点对的多条链路重叠）。

#### 3. 节点添加层（`core.js` 第223-235行）

```javascript
const addNodes = function (newNodes, newLinks) {
  // 添加新节点（去重）
  newNodes.forEach((e) => {
    if (!nodes.find(z => z.id === e.id)) {
      nodes.push(e)
    }
  })
  // 添加新链路（去重）
  newLinks.forEach((e) => {
    if (!links.find(z => z.id === e.id)) {
      links.push(e)
    }
  })
  updateLayout();  // 关键：触发重新渲染
}
```

#### 4. D3 力导向图关联核心（`core.js` 第134-141行 + 218-220行）

**创建力导向图时**：
```javascript
simulation = d3.forceSimulation()
  .force('link', d3.forceLink().distance(linkDistance).id(d => d.id))
  //                                              ^^^^^^^^^^^
  //                                              关键：指定节点ID访问器
```

**更新关联时**（`updateLayout` 函数第218-220行）：
```javascript
simulation.nodes(nodes);                    // 1. 注册所有节点
simulation.force('link').links(links);      // 2. 注册所有链路
simulation.alpha(1).restart();              // 3. 重启物理模拟
```

**D3 forceLink 的关联机制**：
- `d3.forceLink()` 内部会遍历 links 数组
- 对每个 link，根据 `.id(d => d.id)` 配置，将 `source: 1` 转换为对 `nodes.find(n => n.id === 1)` 的实际节点引用
- 最终 link 对象变成：`{source: NodeObject, target: NodeObject, ...}`
- 这样在 `ticked` 回调中，`d.source.x` 和 `d.target.y` 就能直接访问节点坐标

#### 5. 渲染更新层（`core.js` 第87-93行）

```javascript
linksLayer.selectAll('path')
  .attr('d', d => drawLink(d))          // 绘制路径
  .attr('x1', d => d.source.x)         // 获取源节点实时x坐标
  .attr('y1', d => d.source.y)         // 获取源节点实时y坐标
  .attr('x2', d => d.target.x)         // 获取目标节点实时x坐标
  .attr('y2', d => d.target.y);        // 获取目标节点实时y坐标
```

---

### 三、Link 关联的完整数据流

| 阶段 | 数据形式 | 说明 |
|------|----------|------|
| 1. 定义 | `{source: 1, target: 6}` | 使用节点 ID |
| 2. 预处理 | 添加 `pathIndex`, `pathCount` 等 | 计算多链路参数 |
| 3. 添加 | `links.push(link)` | 加入全局数组 |
| 4. D3关联 | `source: Node{...}, target: Node{...}` | D3 将 ID 替换为节点对象引用 |
| 5. 渲染 | `d.source.x, d.target.y` | 实时读取节点坐标绘制连线 |

---

### 四、总结：Link 关联的核心机制

1. **ID 引用机制**：link 数据通过 `source`/`target` 字段存储节点 ID，而非直接引用对象
2. **D3 自动解析**：`forceLink().id(d => d.id)` 配置让 D3 自动将 ID 转换为节点对象引用
3. **增量添加**：`addNodes` 函数将新节点/链路追加到全局数组，避免全量重绘
4. **物理模拟驱动**：simulation 的 `tick` 事件每帧触发，自动计算节点位置，link 自动跟随节点移动
5. **多链路处理**：preprocess 计算的 `pathIndex`/`pathCount` 让同一节点对的多条链路呈现不同弯曲度，避免重叠

这种设计实现了**数据与渲染的解耦**：数据层只需定义节点 ID 关系，D3 引擎自动处理坐标计算和关联绑定。

## 问题分析

根据之前的分析，`kg.setOption` 会调用内部的 `start` 函数，该函数会执行：
```javascript
nodes.splice(0)
links.splice(0)
nodes.push(...startNodes)
links.push(...startLinks)
```
这会清空并重新初始化所有节点和链路，导致图谱闪烁、位置重置。

---

```javascript
// ==================== Link Creation ====================
function createLink(node1, node2, linkType = '关联') {
    const srcId = typeof node1.id !== 'undefined' ? node1.id : node1;
    const tgtId = typeof node2.id !== 'undefined' ? node2.id : node2;
    
    // 创建链路对象（使用节点ID）
    const link = { 
        id: Date.now(), 
        source: srcId, 
        target: tgtId, 
        type: linkType, 
        properties: {} 
    };
    
    // 添加到数据源
    kgData.links.push(link);
    
    // 【关键修复】使用 kg.addNodes 增量添加链路
    // 参数：空节点数组 + 新链路数组
    kg.addNodes([], [link]);
    
    // persistKgData();
    alert(`已建立连接: ${node1.name} - ${node2.name} (${linkType})`);
    return true;
}
```

## Path 未正确绘制的原因分析

根据流程分析，`preprocess` 函数会为 link 添加必要的渲染属性：

```javascript
// preprocess.js 第48-57行
return Object.assign({
  type: '',
  pathIndex: 0,      // 用于多链路弯曲绘制
  pathCount: 1,
  color: defaultLinkColor,      // '#ccc'
  textColor: defaultLinkTextColor,
  linkClass: defaultLinkClass,  // 'kg-link'
  textClass: defaultLinkTextClass,
  width: defaultLinkWidth       // 1
}, l)
```

用户的代码创建的 link 对象缺少这些属性，导致 SVG path 无法正确渲染。

---

## 完整修复代码

```javascript
// ==================== Link Creation ====================
function createLink(node1, node2, linkType = '关联') {
    const srcId = typeof node1.id !== 'undefined' ? node1.id : node1;
    const tgtId = typeof node2.id !== 'undefined' ? node2.id : node2;
    
    // 检查同一方向上是否已存在相同 type 的链接
    const existingLink = kgData.links.find(l => 
        l.source === srcId && l.target === tgtId && l.type === linkType
    );
    if (existingLink) {
        alert(`从 ${node1.name} 到 ${node2.name} 已存在类型为 "${linkType}" 的连接！`);
        return false;
    }
    
    // 创建原始链路对象（只需必要字段）
    const rawLink = { 
        id: Date.now(), 
        source: srcId, 
        target: tgtId, 
        type: linkType,
        properties: {} 
    };
    
    // 【关键】找出同一节点对之间的所有链接（双向）
    const samePairLinks = kgData.links.filter(l => 
        (l.source === srcId && l.target === tgtId) || 
        (l.source === tgtId && l.target === srcId)
    );
    
    // 将新链接加入待处理数组
    const allPairLinks = [...samePairLinks, rawLink];
    
    // 使用 preprocess 重新处理同一节点对的【所有】链接
    // 这样 pathIndex 和 pathCount 会基于完整数据重新计算
    const { _links } = kg.preprocess([], allPairLinks, {});
    
    // 更新 kgData 中同一节点对的现有链接属性
    _links.forEach(processedLink => {
        const existingIndex = kgData.links.findIndex(l => l.id === processedLink.id);
        if (existingIndex !== -1) {
            // 更新已存在的链接的 pathIndex 和 pathCount
            kgData.links[existingIndex].pathIndex = processedLink.pathIndex;
            kgData.links[existingIndex].pathCount = processedLink.pathCount;
        } else {
            // 添加新链接
            kgData.links.push(processedLink);
        }
    });
    
    // 使用 kg.addNodes 增量添加链路（传入处理后的所有链接）
    kg.addNodes([], _links);
    
    // persistKgData();
    alert(`已建立连接: ${node1.name} → ${node2.name} (${linkType})`);
    return true;
}


```

---

## 问题根因对照表

| 缺失属性 | 渲染时用途 | 影响 |
|---------|-----------|------|
| `linkClass: 'kg-link'` | SVG path 的 CSS 类名 | path 元素无样式，可能不可见 |
| `color: '#ccc'` | path 描边颜色 | 连线颜色缺失 |
| `width: 1` | path 描边宽度 | 连线可能太细或不可见 |
| `pathIndex: 0` | 多链路弯曲计算 | 影响曲线绘制逻辑 |
| `pathCount: 1` | 多链路数量统计 | 影响曲线绘制逻辑 |
| `textClass: 'kg-link-text'` | 文字样式类 | 链路文字无样式 |

---

## 流程对比

```
原项目流程（正确）：
menu.js CLICK → m.event.source() → preprocess(nodes, links, menu) → addNodes(_nodes, _links)

用户代码流程（错误）：
createLink → 直接创建 link 对象 → kg.addNodes([], [link])
                    ↓
            缺少 preprocess 处理
                    ↓
            link 缺少渲染属性 → path 绘制失败
```

修复后的代码在创建 link 时手动补全了所有必要属性，确保渲染层能正确读取并绘制 path。