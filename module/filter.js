'use strict'

export const filter_shadow = String.raw`<filter id="filter_shadow" x="-50%" y="-50%" width="160%" height="160%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB">
	<feDropShadow stdDeviation="10 10" in="merge" dx="0" dy="0" flood-color="#ffffff" flood-opacity="1" x="-50%" y="-50%" width="100%" height="100%" result="dropShadow"/>
</filter>`
export const filter_blur = String.raw`<filter id="filter_blur" x="-10%" y="-10%" width="140%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB">
	<feGaussianBlur stdDeviation="0 10" x="-50%" y="-50%" width="100%" height="100%" in="SourceGraphic" edgeMode="none" result="blur"/>
</filter>`
export const filter_color_matrix = String.raw`<filter id="filter_color_matrix" x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB">
	<feColorMatrix type="saturate" values="5" x="-50%" y="-50%" width="100%" height="100%" in="blur" result="colormatrix"/>
</filter>`

export function init_filter(draw) {
  const shadow = SVG(filter_shadow)
  const blur = SVG(filter_blur)
  const color_matrix = SVG(filter_color_matrix)
  draw.defs().add(shadow)
  draw.defs().add(blur)
  draw.defs().add(color_matrix)
}
