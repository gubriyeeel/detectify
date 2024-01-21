"use client"

import React, { useRef, useState } from 'react'
import Webcam from "react-webcam"

type Props = {}

const HomePage = (props: Props) => {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // States
  const [mirrored, setMirrored] = useState<boolean>(false)

  return (
    <div className="flex h-screen">
      {/* Left Division - Camera and Canvas */}
      <div className="relative">
        <div className="relative h-screen w-full">
          <Webcam
            ref={webcamRef}
            mirrored={mirrored}
            className="h-full w-full object-contain p-2"
          />
          <canvas 
            ref={canvasRef}
            className="absolute top-0 left-0 h-full w-full object-contain"
          >
          
          </canvas>
        </div>
      </div>

      {/* Right Division - Button Panel and Wiki Section */}
      
    </div>
  );
}

export default HomePage