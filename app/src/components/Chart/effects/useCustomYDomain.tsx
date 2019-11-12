import { Props } from '../Chart'
import { useMemo } from 'react'
import { Point } from '../Model'

export function useCustomYDomain(props: Props) {
  return useMemo(() => {
    const data = props.data
    const calculatedDomain = domainForData(data)
    const yDomain: [number, number] = props.range
      ? [(props.range[0] === undefined ? calculatedDomain[0] : props.range[0]), (props.range[1] === undefined ? calculatedDomain[1] : props.range[1])]
      : calculatedDomain

    return yDomain
  }, [props.data])
}

function domainForData(data: Array<Point>): [number, number] {
  if (!data[0]) {
    const defaultDomain: [number, number] = [-1, 1]
    return defaultDomain
  }
  let max = data[0].y
  let min = data[0].y
  data.forEach(d => {
    if (max < d.y) {
      max = d.y
    }
    if (min > d.y) {
      min = d.y
    }
  })
  if ((max === 1 || max === 0) && (min === 1 || min === 0)) {
    return [0, 1]
  }
  if (min === max) {
    return [min - 0.5 * min, min + 0.5 * min]
  }
  return [min, max]
}
