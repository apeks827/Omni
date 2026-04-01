import React, { useState, useEffect, useRef } from 'react'
import { Task } from '../types'
import { Card, Text, Button } from '../design-system'

interface TaskNode {
  id: string
  task: Task
  x: number
  y: number
  dependencies: string[]
  dependents: string[]
}

interface DependencyGraphProps {
  tasks: Task[]
  onTaskClick?: (taskId: string) => void
}

const DependencyGraph: React.FC<DependencyGraphProps> = ({
  tasks,
  onTaskClick,
}) => {
  const [nodes, setNodes] = useState<TaskNode[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  // eslint-disable-next-line no-undef
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const taskNodes: TaskNode[] = tasks.map((task, index) => ({
      id: task.id,
      task,
      x: 150 + (index % 5) * 200,
      y: 100 + Math.floor(index / 5) * 150,
      dependencies: [],
      dependents: [],
    }))

    setNodes(taskNodes)
  }, [tasks])

  const getNodeColor = (task: Task) => {
    if (task.status === 'completed' || task.status === 'done') return '#10b981'
    if (task.status === 'in_progress') return '#3b82f6'
    if (task.status === 'pending' || task.status === 'todo') return '#6b7280'
    return '#ef4444'
  }

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId)
    if (onTaskClick) {
      onTaskClick(nodeId)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5))
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <Card
      style={{
        padding: 0,
        height: '600px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          gap: 8,
        }}
      >
        <Button size="sm" onClick={handleZoomIn}>
          +
        </Button>
        <Button size="sm" onClick={handleZoomOut}>
          -
        </Button>
        <Button size="sm" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {nodes.map(node =>
            node.dependencies.map(depId => {
              const depNode = nodes.find(n => n.id === depId)
              if (!depNode) return null
              return (
                <line
                  key={`${node.id}-${depId}`}
                  x1={depNode.x}
                  y1={depNode.y}
                  x2={node.x}
                  y2={node.y}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              )
            })
          )}

          {nodes.map(node => (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => handleNodeClick(node.id)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                r="40"
                fill={getNodeColor(node.task)}
                stroke={selectedNode === node.id ? '#1e293b' : 'transparent'}
                strokeWidth="3"
                opacity="0.9"
              />
              <text
                textAnchor="middle"
                dy="0.3em"
                fill="white"
                fontSize="12"
                fontWeight="600"
                style={{ pointerEvents: 'none' }}
              >
                {node.task.title.substring(0, 8)}
              </text>
            </g>
          ))}

          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
            </marker>
          </defs>
        </g>
      </svg>

      {selectedNode && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 8,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          {(() => {
            const node = nodes.find(n => n.id === selectedNode)
            if (!node) return null
            return (
              <>
                <Text variant="h3" style={{ marginBottom: 8 }}>
                  {node.task.title}
                </Text>
                <Text variant="body" color="gray600">
                  {node.task.description || 'No description'}
                </Text>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      backgroundColor: getNodeColor(node.task),
                      color: 'white',
                    }}
                  >
                    {node.task.status}
                  </span>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      backgroundColor: '#e2e8f0',
                      color: '#334155',
                    }}
                  >
                    {node.task.priority}
                  </span>
                </div>
              </>
            )
          })()}
        </div>
      )}
    </Card>
  )
}

export default DependencyGraph
