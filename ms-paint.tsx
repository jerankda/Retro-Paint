"use client"

import type React from "react"
import { Minus, Square, Circle, Paintbrush, Eraser, Pencil, BoxIcon as Bucket } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Tool = "brush" | "pencil" | "eraser" | "line" | "rectangle" | "circle" | "fill"

const colors = [
  "#000000",
  "#808080",
  "#800000",
  "#808000",
  "#008000",
  "#008080",
  "#000080",
  "#800080",
  "#808040",
  "#004040",
  "#0080FF",
  "#004080",
  "#8000FF",
  "#804000",
  "#FF8040",
  "#800040",
  "#FFFFFF",
  "#C0C0C0",
  "#FF0000",
  "#FFFF00",
  "#00FF00",
  "#00FFFF",
  "#0000FF",
  "#FF00FF",
  "#FFFF80",
  "#00FF80",
  "#80FFFF",
  "#8080FF",
  "#FF0080",
  "#FF8000",
  "#C0C0C0",
  "#400000",
]

export default function Component() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedTool, setSelectedTool] = useState<Tool>("brush")
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [imageData, setImageData] = useState<ImageData | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Fill canvas with white background
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const floodFill = (ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string) => {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height

    const targetColor = getPixelColor(data, x, y, width)
    const fillColorRgb = hexToRgb(fillColor)

    if (!fillColorRgb || colorsEqual(targetColor, fillColorRgb)) return

    const stack = [{ x, y }]
    const visited = new Set<string>()

    while (stack.length > 0) {
      const { x: currentX, y: currentY } = stack.pop()!
      const key = `${currentX},${currentY}`

      if (visited.has(key) || currentX < 0 || currentX >= width || currentY < 0 || currentY >= height) continue
      visited.add(key)

      const currentColor = getPixelColor(data, currentX, currentY, width)
      if (!colorsEqual(currentColor, targetColor)) continue

      setPixelColor(data, currentX, currentY, width, fillColorRgb)

      stack.push(
        { x: currentX + 1, y: currentY },
        { x: currentX - 1, y: currentY },
        { x: currentX, y: currentY + 1 },
        { x: currentX, y: currentY - 1 },
      )
    }

    ctx.putImageData(imageData, 0, 0)
  }

  const getPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number) => {
    const index = (y * width + x) * 4
    return {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
      a: data[index + 3],
    }
  }

  const setPixelColor = (
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    color: { r: number; g: number; b: number },
  ) => {
    const index = (y * width + x) * 4
    data[index] = color.r
    data[index + 1] = color.g
    data[index + 2] = color.b
    data[index + 3] = 255
  }

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null
  }

  const colorsEqual = (a: any, b: any) => {
    return a.r === b.r && a.g === b.g && a.b === b.b
  }

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: Math.floor(e.clientX - rect.left),
      y: Math.floor(e.clientY - rect.top),
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pos = getMousePos(e)
    setIsDrawing(true)
    setStartPos(pos)

    // Store image data for shape tools
    if (selectedTool === "line" || selectedTool === "rectangle" || selectedTool === "circle") {
      setImageData(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }

    ctx.strokeStyle = selectedColor
    ctx.fillStyle = selectedColor
    ctx.lineWidth = selectedTool === "eraser" ? brushSize * 2 : brushSize
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (selectedTool === "fill") {
      floodFill(ctx, pos.x, pos.y, selectedColor)
      return
    }

    if (selectedTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out"
    } else {
      ctx.globalCompositeOperation = "source-over"
    }

    if (selectedTool === "brush" || selectedTool === "pencil" || selectedTool === "eraser") {
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pos = getMousePos(e)

    if (selectedTool === "brush" || selectedTool === "pencil" || selectedTool === "eraser") {
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    } else if (selectedTool === "line" || selectedTool === "rectangle" || selectedTool === "circle") {
      // Clear and redraw for preview
      if (imageData) {
        ctx.putImageData(imageData, 0, 0)
      }

      ctx.strokeStyle = selectedColor
      ctx.lineWidth = brushSize
      ctx.globalCompositeOperation = "source-over"

      if (selectedTool === "line") {
        ctx.beginPath()
        ctx.moveTo(startPos.x, startPos.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
      } else if (selectedTool === "rectangle") {
        const width = pos.x - startPos.x
        const height = pos.y - startPos.y
        ctx.strokeRect(startPos.x, startPos.y, width, height)
      } else if (selectedTool === "circle") {
        const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2))
        ctx.beginPath()
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      }
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setImageData(null)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const newFile = () => {
    if (confirm("Create a new file? Any unsaved work will be lost.")) {
      clearCanvas()
    }
  }

  const saveImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = "paint-image.png"
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="min-h-screen bg-[#c0c0c0] font-mono text-sm">
      {/* Window Title Bar */}
      <div className="bg-[#008080] text-white px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white/20 border border-white/40"></div>
          <span className="font-bold">untitled - Paint</span>
        </div>
        <div className="flex gap-1">
          <button className="w-4 h-4 bg-[#c0c0c0] border border-black text-black text-xs flex items-center justify-center hover:bg-[#e0e0e0]">
            _
          </button>
          <button className="w-4 h-4 bg-[#c0c0c0] border border-black text-black text-xs flex items-center justify-center hover:bg-[#e0e0e0]">
            □
          </button>
          <button className="w-4 h-4 bg-[#c0c0c0] border border-black text-black text-xs flex items-center justify-center hover:bg-[#e0e0e0]">
            ×
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-[#c0c0c0] border-b-2 border-[#808080] px-2 py-1">
        <div className="flex gap-4 text-black">
          <div className="relative group">
            <button className="hover:bg-[#0000ff] hover:text-white px-2 py-1">File</button>
            <div className="absolute top-full left-0 bg-[#c0c0c0] border-2 border-[#808080] shadow-lg hidden group-hover:block z-10 min-w-[120px]">
              <button
                onClick={newFile}
                className="block w-full text-left px-3 py-1 hover:bg-[#0000ff] hover:text-white"
              >
                New
              </button>
              <button
                onClick={saveImage}
                className="block w-full text-left px-3 py-1 hover:bg-[#0000ff] hover:text-white"
              >
                Save As...
              </button>
              <hr className="border-[#808080]" />
              <button
                onClick={clearCanvas}
                className="block w-full text-left px-3 py-1 hover:bg-[#0000ff] hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>
          <button className="hover:bg-[#0000ff] hover:text-white px-2 py-1">Edit</button>
          <button className="hover:bg-[#0000ff] hover:text-white px-2 py-1">View</button>
          <button className="hover:bg-[#0000ff] hover:text-white px-2 py-1">Image</button>
        </div>
      </div>

      <div className="flex">
        {/* Tool Palette */}
        <div className="bg-[#c0c0c0] border-r-2 border-[#808080] p-2">
          <div className="grid grid-cols-2 gap-1 mb-4">
            <button
              onClick={() => setSelectedTool("brush")}
              className={`w-8 h-8 border-2 flex items-center justify-center ${
                selectedTool === "brush"
                  ? "border-[#000080] bg-[#0000ff] text-white"
                  : "border-[#808080] bg-[#c0c0c0] hover:bg-[#e0e0e0]"
              }`}
              title="Brush"
            >
              <Paintbrush className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedTool("pencil")}
              className={`w-8 h-8 border-2 flex items-center justify-center ${
                selectedTool === "pencil"
                  ? "border-[#000080] bg-[#0000ff] text-white"
                  : "border-[#808080] bg-[#c0c0c0] hover:bg-[#e0e0e0]"
              }`}
              title="Pencil"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedTool("eraser")}
              className={`w-8 h-8 border-2 flex items-center justify-center ${
                selectedTool === "eraser"
                  ? "border-[#000080] bg-[#0000ff] text-white"
                  : "border-[#808080] bg-[#c0c0c0] hover:bg-[#e0e0e0]"
              }`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedTool("fill")}
              className={`w-8 h-8 border-2 flex items-center justify-center ${
                selectedTool === "fill"
                  ? "border-[#000080] bg-[#0000ff] text-white"
                  : "border-[#808080] bg-[#c0c0c0] hover:bg-[#e0e0e0]"
              }`}
              title="Fill"
            >
              <Bucket className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedTool("line")}
              className={`w-8 h-8 border-2 flex items-center justify-center ${
                selectedTool === "line"
                  ? "border-[#000080] bg-[#0000ff] text-white"
                  : "border-[#808080] bg-[#c0c0c0] hover:bg-[#e0e0e0]"
              }`}
              title="Line"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedTool("rectangle")}
              className={`w-8 h-8 border-2 flex items-center justify-center ${
                selectedTool === "rectangle"
                  ? "border-[#000080] bg-[#0000ff] text-white"
                  : "border-[#808080] bg-[#c0c0c0] hover:bg-[#e0e0e0]"
              }`}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedTool("circle")}
              className={`w-8 h-8 border-2 flex items-center justify-center ${
                selectedTool === "circle"
                  ? "border-[#000080] bg-[#0000ff] text-white"
                  : "border-[#808080] bg-[#c0c0c0] hover:bg-[#e0e0e0]"
              }`}
              title="Circle"
            >
              <Circle className="w-4 h-4" />
            </button>
          </div>

          {/* Brush Size */}
          <div className="mb-4 border-2 border-[#808080] p-2 bg-white">
            <div className="text-xs mb-2 text-center">Size</div>
            <div className="flex flex-col gap-1">
              {[1, 3, 5, 8].map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`h-6 border flex items-center justify-center ${
                    brushSize === size ? "border-[#000080] bg-[#e0e0ff]" : "border-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <div className="bg-black rounded-full" style={{ width: `${size}px`, height: `${size}px` }} />
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div className="border-2 border-[#808080] p-2 bg-white">
            <div className="grid grid-cols-8 gap-0.5 mb-2">
              {colors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColor(color)}
                  className={`w-4 h-4 border ${
                    selectedColor === color ? "border-2 border-white shadow-inner" : "border-gray-400"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Current Colors */}
            <div className="flex gap-2 mt-2">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-black" style={{ backgroundColor: selectedColor }} />
                <span className="text-xs mt-1">Color</span>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-4 bg-[#c0c0c0]">
          <div className="border-2 border-[#808080] bg-white p-2 inline-block">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="border border-gray-300 bg-white"
              style={{
                cursor: selectedTool === "fill" ? "crosshair" : selectedTool === "eraser" ? "grab" : "crosshair",
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#c0c0c0] border-t-2 border-[#808080] px-2 py-1 flex items-center justify-between text-black text-xs">
        <div className="flex items-center gap-4">
          <span>
            Tool: {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} | Size: {brushSize}px
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>800 x 600</span>
          <div className="w-4 h-4 border border-[#808080]" style={{ backgroundColor: selectedColor }} />
        </div>
      </div>
    </div>
  )
}
