'use client'

import { getSmoothStepPath, EdgeLabelRenderer, BaseEdge, type EdgeProps } from '@xyflow/react'

interface CustomEdgeData {
  labelText?:   string
  labelBg?:     string
  labelBorder?: string
  labelColor?:  string
  sibOffset?:   number
}

/**
 * Smoothstep edge with sibling offset and optional HTML label.
 * The sibOffset shifts the source/target Y so sibling edges fan out
 * instead of overlapping on the same path.
 */
export function GraphCustomEdge({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  data, markerEnd, style,
}: EdgeProps) {
  const d = data as CustomEdgeData | undefined
  const offset = d?.sibOffset ?? 0

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY: sourceY + offset,
    sourcePosition,
    targetX,
    targetY: targetY + offset,
    targetPosition,
    borderRadius: 16,
  })

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {d?.labelText && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-none nodrag nopan"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          >
            <div
              className="rounded-xl px-2 py-0.5 text-[11px] font-bold shadow-sm border"
              style={{
                background:   d.labelBg,
                borderColor:  d.labelBorder,
                color:        d.labelColor,
              }}
            >
              {d.labelText}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
