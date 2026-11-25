import { scaleQuantile, scaleSequential, scaleLinear } from 'd3-scale'
import { interpolateRgbBasis } from 'd3-interpolate'

// Ramp dibuat untuk dua latar: peta gelap (layar Peta) dan kartu terang.
export const RAMP = {
  dampak: ['#173A33', '#1E6A73', '#2A98B8', '#7CC8E8', '#E6F6FF'],
  hulu: ['#2A2A1C', '#6B4A1E', '#B86A22', '#F09A3A', '#FFD79A'],
  prioritas: ['#173327', '#1F5A3E', '#3E8F4E', '#8CCB4E', '#DDF77A'],
  hujan: ['#14283A', '#1D4E7A', '#2C7FC0', '#5DB7F0', '#C6ECFF'],
  erosi: ['#2B261C', '#5B4528', '#8E6A36', '#C79A55', '#F2D39A']
}
export const RAMP_TERANG = {
  dampak: ['#E8F4F7', '#B6DDE8', '#5BB0CB', '#1F7FA0', '#0D4A63'],
  hulu: ['#FBF1E2', '#F6D3A0', '#EE9F4E', '#C8661F', '#7A3510'],
  prioritas: ['#EDF7E6', '#C6E7A8', '#82C46A', '#2F8F55', '#0E4D3C'],
  hujan: ['#EAF4FB', '#B9DCF3', '#6AB3E3', '#2479B8', '#0F4373']
}

export function quantileScale(values, ramp) {
  const v = values.filter(x => x != null && !Number.isNaN(x))
  return scaleQuantile().domain(v).range(ramp)
}
export function seqScale(domain, ramp) {
  return scaleSequential(interpolateRgbBasis(ramp)).domain(domain).clamp(true)
}
export { scaleLinear }
