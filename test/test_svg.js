'use strict'

export const test_svg = String.raw`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" width="742" height="556.5" viewBox="-371 -278.25 742 556.5" transform="matrix(1,0,0,-1,0,0)"><defs><marker markerWidth="6" markerHeight="6" refX="3" refY="3" viewBox="0 0 6 6" orient="auto" class="vector-start-marker" id="SvgjsMarker1001"><circle r="3" cx="3" cy="3" class="vector-marker-start"></circle></marker><marker markerWidth="10" markerHeight="6" refX="10" refY="3" viewBox="0 0 10 6" orient="auto" class="vector-end-marker" id="SvgjsMarker1000"><polygon points="0 0, 10 3 , 0 6" stroke-width="1" class="vector-marker-end"></polygon></marker></defs><foreignObject width="742" height="556.5" x="-371" y="-278.25"><div id="board"></div></foreignObject><rect width="0" height="0" class="select-box"></rect><filter id="filter_shadow" x="0%" y="0%" width="140%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB">
	<feDropShadow stdDeviation="5 5" in="merge" dx="0" dy="0" flood-color="#0000ff" flood-opacity="1" x="-50%" y="-50%" width="120%" height="120%" result="dropShadow"></feDropShadow>
</filter><filter id="filter_blur" x="-10%" y="-10%" width="140%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB">
	<feGaussianBlur stdDeviation="0 10" x="-50%" y="-50%" width="100%" height="100%" in="SourceGraphic" edgeMode="none" result="blur"></feGaussianBlur>
</filter><filter id="filter_color_matrix" x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB">
	<feColorMatrix type="saturate" values="5" x="-50%" y="-50%" width="100%" height="100%" in="blur" result="colormatrix"></feColorMatrix>
</filter><line x1="-371" y1="0" x2="371" y2="0" class="axis-x shape component" marker-end="url(#SvgjsMarker1000)" component_no="1"></line><line x1="-371" y1="0" x2="371" y2="0" class="cover line-select-box" of="1"></line><circle r="0.5" cx="-371" cy="0" class="hidden-point" id="axis-x-start"></circle><circle r="0.5" cx="371" cy="0" class="hidden-point" id="axis-x-end"></circle><line x1="0" y1="-278.25" x2="0" y2="278.25" class="axis-y shape component" marker-end="url(#SvgjsMarker1000)" component_no="2"></line><line x1="0" y1="-278.25" x2="0" y2="278.25" class="cover line-select-box" of="2"></line><circle r="0.5" cx="0" cy="-278.25" class="hidden-point" id="axis-y-start"></circle><circle r="0.5" cx="0" cy="278.25" class="hidden-point" id="axis-y-end"></circle><circle r="89.02246907382428" cx="0" cy="0" class="circle dashed shape component selected filled" filter="url(#filter_shadow)" component_no="5" component_refs="3,4"></circle><circle r="89.02246907382428" cx="0" cy="0" class="cover line-select-box" of="5"></circle><line x1="0" y1="0" x2="70" y2="-55" class="vector dashed shape component selected" marker-start="url(#SvgjsMarker1001)" marker-end="url(#SvgjsMarker1000)" component_no="6" component_refs="3,4"></line><line x1="0" y1="0" x2="70" y2="-55" class="cover line-select-box" of="6"></line><circle r="3" cx="0" cy="0" class="point component selected" component_no="3"></circle><style>
:root {
  --vector-marker-color: #1dd3fd;
  --text-color: #fff;
  --point-fill-color: #78a5cF;
  --point-hidden-color: var(--ui-background-color);
  --intersect-point-fill-color: #78a5cF88;
  --selected-intersect-point-stroke-color: #fff;
  --parallel-point-fill-color: #78a5cF88;
  --shape-stroke-color: #83E0E5;
  --shape-fill-color: #1dd3fd55;
  --selected-stroke-color: #F3F0F5;
  --select-box-stroke-color: #fff;

  --axis-stroke-color: #1dd3fd;
  --ui-background-color: #050A30;
  --ui-inspector-background-color: #1b1b1b5c;
  --ui-inspector-text-color: #fff;
}

/* ui */
body {
  background-color: var(--ui-background-color);
  background-image: url(images/sky.jpg);
  background-size: cover;
  background-repeat: no-repeat;
  font-family: 'Source Code Pro', monospace;
  font-size: large;
}

#board {
  background-color: rgba(15, 15, 15, 0.7);
  border-radius: 12px;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

/*
#editArea {
  background-color: rgba(15, 15, 15, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
}
*/

#preview {
  visibility: hidden;
}

#inspector {
  border: 0;
  background-color: var(--ui-inspector-background-color);
  /* backdrop-filter: blur(10px); */
  color: var(--ui-inspector-text-color);
  margin: 10px;
  padding: 2px;
  user-select: none;
}

#logo {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 64px;
}

.field {
  margin-top: 3px;
  margin-left: 10px;
  padding-left: 3px;
  box-shadow: none;
  box-sizing: border-box;
  display: inline-block;
  line-height: 0.7;
  resize: none;
  appearance: none;
  border: 0; 
  background-color: #33333363;
  outline: none;
  color: #fff;
}

.field_label {
  display: inline-block;
  width: 4em;
}

.long {
  width: 400px;
}

.hidden {
  opacity: 0.3 !important;
}

/* shapes */

.vector-marker-start, .vector-marker-end {
  fill: var(--vector-marker-color);
}

.shape {
  stroke: var(--shape-stroke-color);
  fill: none;
  opacity: 0.8;
}

.shape.filled {
  fill: var(--shape-fill-color);
}

.point {
  fill: var(--point-fill-color);
  stroke: none;
}

.point, .pin-point:hover {
  cursor: grab;
}

.intersect-point, .parallel-point, .perp-point, .pin-point {
  fill: var(--intersect-point-fill-color);
  stroke: none;
}

.intersect-point, .parallel-point, .perp-point:hover {
  cursor: pointer;
}

.axis-x,.axis-y {
  stroke: var(--axis-stroke-color);
  stroke-width: 1.2;
}

.text, .latex, .label {
  color: var(--text-color);
  fill: var(--text-color);
  user-select: none;
}

/* selections */

.line-select-box {
  stroke: rgba(1,0,0,0);
  stroke-width: 3;
  fill: none;
}

.line-select-box:hover {
  cursor: grab;
}

.dragging:hover {
  cursor: crosshair;
}

.shape.selected, .shape.dashed.selected {
  stroke: var(--selected-stroke-color);
}

.point.selected {
  stroke: var(--selected-stroke-color);
  stroke-width: 1;
}

.intersect-point.selected, .parallel-point.selected, .perp-point.selected, .pin-point.selected {
  stroke: var(--selected-intersect-point-stroke-color);
  stroke-width: 0.5;
}

.select-box {
  stroke: var(--select-box-stroke-color);
  stroke-dasharray: 2;
  fill: none;
}

/* dashed */
.dashed {
  stroke-dasharray: 3;
}
</style><circle r="3" cx="70" cy="-55" class="point component selected" component_no="4"></circle></svg>`
