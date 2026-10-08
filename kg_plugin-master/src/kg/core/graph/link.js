const arrowStyle = {
  width: 0.2,
  size: 6
}

const getLinkDesc = d => {
  const {source, target} = d
  const x1 = source.x
  const y1 = source.y
  const r1 = source.r
  const x2 = target.x
  const y2 = target.y
  const r2 = target.r
  const centerDistance = Math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
  const gapDistance = centerDistance - r1 - r2
  const noArrowGapDis = gapDistance - arrowStyle.size

  const baseDeflectionStep = 15
  const maxDeflection = 150
  const middleIndex = (d.pathCount - 1) / 2
  const stepsCount = d.pathIndex - 1
  
  const totalDeflection = stepsCount * baseDeflectionStep
  const realDeflectionStep = totalDeflection > maxDeflection ? maxDeflection / stepsCount : baseDeflectionStep
  
  const dir = x1 > x2 ? 1 : -1
  const deflection = realDeflectionStep * (d.pathIndex - middleIndex) * dir

  return {
    x1,
    y1,
    r1,
    x2,
    y2,
    r2,
    centerDistance,
    gapDistance,
    noArrowGapDis,
    deflection
  }
}

const getLinkTextWidth = (id, dis) => {
  const ele = document.getElementById(`linkText_${id}`);
  if (ele) {
    const o = document.getElementById(`linkText_${id}`).getBBox().width;
    if (true) {
    // if (dis > 2 * o && dis > 100) {
      return o * 1.2;
    }
  }
  return 0;
}

const getLinkTextPosition = (d) => {
  const {gapDistance, r1, deflection, noArrowGapDis} = getLinkDesc(d)
  let offsetY = 0
  if (deflection === 0) {
    offsetY = -30
  } else {
    const {arcRadius, cy} = getCurveDesc(getLinkDesc(d), getLinkTextWidth(d.id, gapDistance))
    
    if (cy > 0) {
      offsetY = (arcRadius - cy) + 30;
    } else {
      offsetY = (arcRadius + cy) - 30;
    }
    offsetY = offsetY * (deflection > 0 ? 1 : -1)
  }
  return {
    x: noArrowGapDis / 2 + r1,
    y: offsetY
  }
}






const straightLink = (d) => {
  const {r1, gapDistance, noArrowGapDis} = getLinkDesc(d)

  const getTextBreak = (startOffset, id, gapDistance, noArrowGapDis) => {
    const breakWidth = getLinkTextWidth(id, gapDistance)
    const allowance = (noArrowGapDis - breakWidth) / 2 // 连接长度减去断开长度后对半，为断开两侧的剩余长度
    const startBreak = startOffset + allowance
    const endBreak = startOffset + noArrowGapDis - allowance
  
    return {
      start: startBreak,
      end: endBreak
    }
  }
  const textBreak = getTextBreak(r1, d.id, gapDistance, noArrowGapDis)
  // y轴高度偏移
  const offset = arrowStyle.width / 2 
  const endOffset = r1 + noArrowGapDis
  // 前半段闭合路径
  const firstLine = [
    'M', r1, offset, 
    'L', textBreak.start, offset, 
    'L', textBreak.start, -offset, 
    'L', r1, -offset, 
    'Z'
  ]
  // 后半段闭合路径(带箭头)
  const arrowHalfHeight = arrowStyle.size / 2
  const secondLine = [
    'M', textBreak.end, offset, 
    'L', endOffset, offset, 
    'L', endOffset, arrowHalfHeight,
    'L', r1 + gapDistance, '0',
    'L', endOffset, -arrowHalfHeight,
    'L', endOffset, -offset,
    'L', textBreak.end, -offset,
    'Z'
  ]
  const pathConfig = [...firstLine, ...secondLine]

  return pathConfig.join(' ')
}

const getCurveDesc = (baseDesc, breakWidth) => {
 const {gapDistance, centerDistance, noArrowGapDis, r1, r2, deflection} = baseDesc
 const startOffset = r1
 const noArrowGapMiddle = noArrowGapDis / 2 + startOffset

 const deflectionRadian = deflection * ((2 * Math.PI) / 360)

 const startAttach = {
  x: Math.cos(deflectionRadian) * r1,
  y: Math.sin(deflectionRadian) * r1,
}

const radiusRatio = r1 / (r2 + arrowStyle.size)
let homotheticCenter
if (radiusRatio === 1) {
  homotheticCenter = (-centerDistance * radiusRatio) / (0.5 - radiusRatio)
} else {
  homotheticCenter = (-centerDistance * radiusRatio) / (1 - radiusRatio)
}

function intersectWithOtherCircle(fixedPoint, radius, xCenter, polarity) {
  const gradient = fixedPoint.y / (fixedPoint.x - homotheticCenter);// 梯度，斜度，变化率；此为过相似圆心homotheticCenter的一条直线；
  const hc = fixedPoint.y - (gradient * fixedPoint.x);// y=kx+b可以得出b=y-kx,即b=yo-kx0；
  const A = 1 + square(gradient);// Ax²+BX+C=0;此处联立直线和圆的方程求解；
  const B = 2 * ((gradient * hc) - xCenter);// 通过圆的标准方程和直线方程联立求得起交点坐标；
  const C = square(hc) + (square(xCenter) - square(radius));// 通过圆的标准方程和直线方程联立求得起交点坐标；
  const intersection = {
    y: (-B + ((polarity * Math.sqrt(square(B))) - (4 * A * C))) / (2 * A), // 通过圆的标准方程和直线方程联立求得起交点坐标；
    x: (-B + (polarity * Math.sqrt(square(B) - (4 * A * C)))) / (2 * A), // 通过圆的标准方程和直线方程联立求得起交点坐标；
  };
  intersection.y = (intersection.x - homotheticCenter) * gradient;// 类似直线方程，带入X求得Y值；
  return intersection;
}
const endAttach = intersectWithOtherCircle(startAttach, r2 + arrowStyle.size, centerDistance, -1);

const g1 = -startAttach.x / startAttach.y // 斜率1
const c1 = startAttach.y - startAttach.x * g1 // 截距1 b = y - kx

const g2 = -(endAttach.x - centerDistance) / endAttach.y
const c2 = endAttach.y - g2 * endAttach.x

const cx = (c1 - c2) / (g2 - g1) || (c1 - c2) / (g2 - (g1 * (11 / 10)))
const cy = (g1 * cx) + c1 //交点y
// 求出距离（圆弧半径）
const arcRadius = Math.sqrt(square(cx - startAttach.x) + square(cy - startAttach.y))

const startAngle = Math.atan2(startAttach.x - cx, cy - startAttach.y)
const endAngle = Math.atan2(endAttach.x - cx, cy - endAttach.y);
let sweepAngle = startAngle - endAngle

let midAngle = (startAngle + endAngle) / 2

if (deflection > 0) {
  sweepAngle = 2 * Math.PI - sweepAngle
  midAngle += Math.PI
}
function startTangent(dr) {
  const dx = (dr < 0 ? 1 : -1) * Math.sqrt(square(dr) / (1 + square(g1)));
  const dy = g1 * dx;
  return {
    x: startAttach.x + dx,
    y: startAttach.y + dy,
  };
}
function endTangent(dr) {
  const dx = (dr < 0 ? -1 : 1) * Math.sqrt(square(dr) / (1 + square(g2)));
  const dy = g2 * dx;
  return {
    x: endAttach.x + dx,
    y: endAttach.y + dy,
  };
}
function angleTangent(angle, dr) {
  return {
    x: cx + ((arcRadius + dr) * Math.sin(angle)),
    y: cy - ((arcRadius + dr) * Math.cos(angle)),
  };
}

function endNormal(dc) {
  const dx = (dc < 0 ? -1 : 1) * Math.sqrt(square(dc) / (1 + square(1 / g2)));
  const dy = dx / g2;
  return {
    x: endAttach.x + dx,
    y: endAttach.y - dy,
  };
}
/**
 * @returns point的xy坐标
 * @param {*} point 
 */
function coord(point) {
  return `${point.x},${point.y}`;
}
const shaftRadius = arrowStyle.width / 2;
const headRadius = arrowStyle.size / 2;
const headerLength = arrowStyle.size
const positiveSweep = startAttach.y > 0 ? 0 : 1;
const negativeSweep = startAttach.y < 0 ? 0 : 1;


let captionSweep = breakWidth / arcRadius * (deflection < 0 ? 1 : -1)
let endBreak;
let startBreak;
startBreak = midAngle - captionSweep / 2
endBreak = midAngle + captionSweep / 2

const calcResults = {
  headEndTan: coord(endTangent(headRadius)),
  negHeadEndTan: coord(endTangent(-headRadius)),

  headEndNormalTan: coord(endNormal(headerLength)),
  
  shaftStartTan: coord(startTangent(shaftRadius)),
  negShaftStartTan: coord(startTangent(-shaftRadius)),

  shaftEndTan: coord(endTangent(shaftRadius)),
  negShaftEndTan: coord(endTangent(-shaftRadius)),

  startBreakShaftAngle: coord(angleTangent(startBreak, shaftRadius)),
  negStartBreakShaftAngle: coord(angleTangent(startBreak, -shaftRadius)),

  endBreakShaftAngle: coord(angleTangent(endBreak, shaftRadius)),
  negEndBreakShaftAngle: coord(angleTangent(endBreak, -shaftRadius)),
  
}


return {
  startAngle,
  midAngle,
  endAngle,
  arcRadius,
  calcResults,
  positiveSweep,
  negativeSweep,
  cy
}


}

const curveLink = d => {
  const baseDesc = getLinkDesc(d)
  const {deflection, gapDistance} = baseDesc
  const {calcResults, arcRadius, positiveSweep, negativeSweep, startAngle, endAngle} 
    = getCurveDesc(baseDesc, getLinkTextWidth(d.id, gapDistance))

  const shaftRadius = arrowStyle.width / 2;

  if (startAngle > endAngle) {
    return [
      'M', calcResults.negHeadEndTan,
      'L', calcResults.headEndNormalTan,
      'L', calcResults.headEndTan,
      'Z'
    ].join(' ')
  }
  
  return [
    'M', calcResults.shaftStartTan,
    'L', calcResults.negShaftStartTan,
    'A', arcRadius - shaftRadius, arcRadius - shaftRadius, 0, 0,
    positiveSweep, calcResults.negStartBreakShaftAngle, 
    'L', calcResults.startBreakShaftAngle, 
    'A', arcRadius + shaftRadius, arcRadius + shaftRadius, 0, 0, 
    negativeSweep, calcResults.shaftStartTan, 'Z', 
    'M', calcResults.endBreakShaftAngle, 
    'L', calcResults.negEndBreakShaftAngle, 
    'A', arcRadius - shaftRadius, arcRadius - shaftRadius, 0, 0, 
    positiveSweep, calcResults.negShaftEndTan, 
    'L', calcResults.negHeadEndTan, 
    'L', calcResults.headEndNormalTan, 
    'L', calcResults.headEndTan, 
    'L', calcResults.shaftEndTan, 
    'A', arcRadius + shaftRadius, arcRadius + shaftRadius, 0, 0, 
    negativeSweep, calcResults.endBreakShaftAngle
  ].join(' ');

}


const drawLink = d => {
  const middleIndex = (d.pathCount - 1) / 2
  if (d.pathIndex === middleIndex) {
    return straightLink(d)
  } else {
    return curveLink(d)
  }
}

function square (l) {
  return l * l
}




export {drawLink, getLinkTextPosition}
