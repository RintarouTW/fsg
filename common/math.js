'use strict'

const tolerance_error = 0.0001

/// helper functions
/// box : { x, y, width, height }
/// point : { x, y }
export function inside(box, point) {
  return point && (point.x >= (box.x - tolerance_error)) && (point.x <= (box.x + box.width + tolerance_error))
  && (point.y >= (box.y - tolerance_error)) && (point.y <= (box.y + box.height + tolerance_error))
}

/// point is the component
export function pointOnScreen(point) {
  const element = point.element
  const p = { x: element.cx(), y: element.cy() }
  const ctm = element.transform()
  const loc = {
    x: p.x * ctm.a + p.y * ctm.c + ctm.e,
    y: p.x * ctm.b + p.y * ctm.d + ctm.f
  }
  return loc
}

// window.pointOnScreen = pointOnScreen

///
/// clipping
/// box : { x, y, width, height }
/// p1 : { x, y }
/// p2 : { x, y }
/// 
export function clipping(box, p1, p2) {
  console.assert(p1, 'p1 is required')
  console.assert(p2, 'p2 is required')

  const v1 = { x: p2.x - p1.x, y: p2.y - p1.y }
  const { x, y, width, height } = box
  let clips = []
  p2 = { x: x, y: y }
  let v2 = { x: 1, y: 0 }
  let clip_point = intersect(p1, v1, p2, v2)
  if (inside(box, clip_point)) {
    clips.push(clip_point)
  }
  v2 = { x: 0, y: 1}
  if (!clip_point || (clip_point.x != x)) {
    clip_point = intersect(p1, v1, p2, v2)
    if (inside(box, clip_point)) clips.push(clip_point)
  }
  p2 = { x: x + width, y: y + height}
  clip_point = intersect(p1, v1, p2, v2)
  if (inside(box, clip_point)) clips.push(clip_point)
  v2 = { x: 1, y: 0}
  if (!clip_point || (clip_point.y != (y + width))) {
    clip_point = intersect(p1, v1, p2, v2)
    if (inside(box, clip_point)) clips.push(clip_point)
  }
  // console.log(clips)
  return clips
}

///
/// intersect
///
export function intersect(p1, v1, p2, v2) {
  let det = v1.x * v2.y - v2.x * v1.y
  if (det == 0) return null
  let l = ((p2.x - p1.x) * v2.y - (p2.y - p1.y) * v2.x) / det
  // let m = (v1.x * (p2.y - p1.y) - (p2.x - p1.x) * v1.y) / det
  return { x: p1.x + l * v1.x, y: p1.y + l * v1.y }
}

export function projectPointOnLine(point, linePoint, lineDirection) {
  const v = { x: (point.x - linePoint.x), y: (point.y - linePoint.y) }
  const dotProduct = v.x * lineDirection.x + v.y * lineDirection.y
  const projectPoint = { x: linePoint.x + lineDirection.x * dotProduct, y: linePoint.y + lineDirection.y * dotProduct }
  return projectPoint
}

export function intersectLineAndCircle(linePoint, lineDirection, circlePoint, circleRadius) {
  console.assert(circleRadius, 'circleRadius must be defined')
  const projectPoint = projectPointOnLine(circlePoint, linePoint, lineDirection)
  const distanceSquare = (circlePoint.x - projectPoint.x) ** 2 + (circlePoint.y - projectPoint.y) ** 2
  if (distanceSquare > circleRadius ** 2) return null
  if (distanceSquare == circleRadius ** 2) return [projectPoint]
  const length = Math.sqrt( circleRadius ** 2 - distanceSquare )
  // console.log(length, circleRadius, distanceSquare)
  const p1 = { x: projectPoint.x + lineDirection.x * length, y: projectPoint.y + lineDirection.y * length }
  const p2 = { x: projectPoint.x - lineDirection.x * length, y: projectPoint.y - lineDirection.y * length }
  // console.log(p1, p2)
  return [p1, p2]
}

export function twoCirclesIntersection(c1, c2){
  //**************************************************************
  //Calculating intersection coordinates (x1, y1) and (x2, y2) of
  //two circles of the form (x - c1.a)^2 + (y - c1.b)^2 = c1.r^2
  //                        (x - c2.a)^2 + (y - c2.b)^2 = c2.r^2
  //
  // Return value:   true if the two circles intersects
  //                 false if the two circles do not intersects
  //**************************************************************
  var val1, val2, test;
  // Calculating distance between circles centers
  var D = Math.sqrt((c1.a - c2.a) ** 2 + (c1.b - c2.b) ** 2);
  var x1, x2, y1, y2
  if (((c1.r + c2.r) >= D) && (D >= Math.abs(c1.r - c2.r))) {
    // Two circles intersects or tangent
    // Area according to Heron's formula
    //----------------------------------
    var a1 = D + c1.r + c2.r;
    var a2 = D + c1.r - c2.r;
    var a3 = D - c1.r + c2.r;
    var a4 = -D + c1.r + c2.r;
    var area = Math.sqrt(a1 * a2 * a3 * a4) / 4;
    // Calculating x axis intersection values
    //---------------------------------------
    val1 = (c1.a + c2.a) / 2 + (c2.a - c1.a) * (c1.r * c1.r - c2.r * c2.r) / (2 * D * D);
    val2 = 2 * (c1.b - c2.b) * area / (D * D);
    x1 = val1 + val2;
    x2 = val1 - val2;
    // Calculating y axis intersection values
    //---------------------------------------
    val1 = (c1.b + c2.b) / 2 + (c2.b - c1.b) * (c1.r * c1.r - c2.r * c2.r) / (2 * D * D);
    val2 = 2 * (c1.a - c2.a) * area / (D * D);
    y1 = val1 - val2;
    y2 = val1 + val2;
    // Intersection pointsare (x1, y1) and (x2, y2)
    // Because for every x we have two values of y, and the same thing for y,
    // we have to verify that the intersection points as chose are on the
    // circle otherwise we have to swap between the points
    test = Math.abs((x1 - c1.a) * (x1 - c1.a) + (y1 - c1.b) * (y1 - c1.b) - c1.r * c1.r);
    if (test > 0.0000001) {
      // point is not on the circle, swap between y1 and y2
      // the value of 0.0000001 is arbitrary chose, smaller values are also OK
      // do not use the value 0 because of computer rounding problems
      var tmp = y1;
      y1 = y2;
      y2 = tmp;
    }
    return [{x: x1, y: y1}, {x: x2, y: y2}];
  }
  // circles are not intersecting each other
  return null;
}

export function intersectTest(draw) {
  // points
  let p1 = new SVG.Point({ x: 20, y: 10 })
  let p2 = new SVG.Point({ x: 140, y: 15 })
  // vectors
  let v1 = new SVG.Point({ x: 20, y: 10 })
  let v2 = new SVG.Point({ x: -20 , y: 20 })

  // vec1
  let vec1 = vec(draw, p1, v1)
  draw.add(vec1)

  // p2 + v2
  let vec2 = vec(draw, p2, v2)
  draw.add(vec2)

  let p3 = intersect(p1, v1, p2, v2)

  // intersect lines to intersect point
  let sect1 = vec(draw, p1, {x: p3.x - p1.x, y: p3.y - p1.y}) 
  let sect2 = vec(draw, p2, {x: p3.x - p2.x, y: p3.y - p2.y})
  sect1.insertBefore(vec1)
  sect2.insertBefore(vec2)

  let finalp = new SVG.Point({x : 20, y: 30})
  vec1.animate(1000, 200).attr({x1: finalp.x, y1: finalp.y}).during(pos => {
    let dx = (finalp.x - p1.x) * pos
    let dy = (finalp.y - p1.y) * pos
    let curP = { x: p1.x + dx, y: p1.y + dy }
    let newV1 = new SVG.Point({ x: p1.x + v1.x - curP.x, y: p1.y + v1.y - curP.y })
    let p3 = intersect(curP, newV1, p2, v2)
    sect1.plot(curP.x, curP.y, p3.x, p3.y)
    sect2.plot(p2.x, p2.y, p3.x, p3.y)
  })
}

