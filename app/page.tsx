"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Camera, FlipHorizontal, PersonStanding, Video } from "lucide-react";

import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

type Props = {};

const HomePage = (props: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [mirrored, setMirrored] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState<boolean>(false)

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
          ></canvas>
        </div>
      </div>

      {/* Right Division - Button Panel and Wiki Section */}
      <div className="flex flex-row flex-1">
        <div className="border-primary/5 border-2 max-w-xs flex flex-col gap-2 justify-between shadow-md rounded-md p-4">
          {/* Top Section */}
          <div className="flex flex-col gap-2">
            <ThemeToggle />
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={() => {
                setMirrored((prev) => !prev);
              }}
            >
              <FlipHorizontal />
            </Button>

            <Separator className="my-2" />
          </div>
          {/* Middle Section */}
          <div className="flex flex-col gap-2">
            <Separator className="my-2" />
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={userPromptScreenshot}
            >
              <Camera />
            </Button>

            <Button
              variant={isRecording ? "destructive" : "outline"}
              size={"icon"}
              onClick={userPromptRecord}
            >
              <Video />
            </Button>

            <Separator className="my-2" />

            <Button
              variant={autoRecordEnabled ? "destructive" : "outline"}
              size={"icon"}
              onClick={toggleAutoRecord}
            >
              {autoRecordEnabled ? "Show animation" : <PersonStanding />}
            </Button>
          </div>
          {/* Bottom Section */}
          <div className="flex flex-col gap-2">
            <Separator className="my-2" />
          </div>
        </div>
      </div>
    </div>
  );

  // Handler Functions

  function userPromptScreenshot() {
    // Take Screenshot
    // Save Screenshot
  }

  function userPromptRecord() {
    // Recording
      // Stop recording
      // Save video

    // Not Recording
      // Start recording
  }

  function toggleAutoRecord() {
    
  }

};

export default HomePage;
