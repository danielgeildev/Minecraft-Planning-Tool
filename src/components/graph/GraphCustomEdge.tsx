'use client'

import { getSmoothStepPath, EdgeLabelRenderer, BaseEdge, type EdgeProps } from '@xyflow/react'

interface CustomEdgeData {
  labelText?:        string
  labelBg?:         string
  labelBorder?:     string
  labelColor?:      string
}

/**
 * Smoothstep edge with an HTML label rendered via EdgeLabelRenderer.
 * This gives full CSS / Tailwind control over the label box so it can
 * match the visual style of the node cards (rounded, bordered, colored bg).
 */
export function GraphCustomEdge({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  data, markerEnd, style,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  const d = data as CustomEdgeData | undefined

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
