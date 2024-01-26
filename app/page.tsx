"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Camera,
  FlipHorizontal,
  Moon,
  PersonStanding,
  Sun,
  Video,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { Rings } from "react-loader-spinner";

import { beep } from "@/utils/audio";

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as cocossd from "@tensorflow-models/coco-ssd";
import { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import { drawOnCanvas } from "@/utils/draw";

type Props = {};

let interval: any = null;

const HomePage = (props: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [mirrored, setMirrored] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState<boolean>(false);
  const [volume, setVolume] = useState(0.8);
  const [model, setModel] = useState<ObjectDetection>();
  const [loading, setLoading] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Initialize Media Recorder
  useEffect(() => {
    if (webcamRef && webcamRef.current) {
      const stream = (webcamRef.current.video as any).captureStream();
      if (stream) {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            const recordedBlob = new Blob([e.data], { type: "video" });
            const videoURL = URL.createObjectURL(recordedBlob);

            const a = document.createElement("a");
            a.href = videoURL;
            a.download = `${formatDate(new Date())}.webm`;
            a.click();
          }
        };
      }
    }
  }, [webcamRef]);

  useEffect(() => {
    let isMounted = true;

    const initModel = async () => {
      try {
        const loadedModel: ObjectDetection = await cocossd.load({
          base: "mobilenet_v2",
        });

        if (isMounted) {
          setModel(loadedModel);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading model:", error);
      }
    };

    if (!model) {
      setLoading(true);
      initModel();
    }

    return () => {
      isMounted = false;
    };
  }, [model]);

  async function runPrediction() {
    if (
      model &&
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const predictions: DetectedObject[] = await model.detect(
        webcamRef.current.video
      );

      resizeCanvas(canvasRef, webcamRef);
      drawOnCanvas(mirrored, predictions, canvasRef.current?.getContext("2d"));
    }
  }

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      runPrediction();
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [webcamRef.current, model, mirrored]);

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
      <div className="flex flex-row flex-1 pt-2 pr-2 pb-2">
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

            <Button
              variant={autoRecordEnabled ? "destructive" : "outline"}
              size={"icon"}
              onClick={toggleAutoRecord}
            >
              {autoRecordEnabled ? (
                <Rings color="white" height={40} />
              ) : (
                <PersonStanding />
              )}
            </Button>

            <Separator className="my-2" />
          </div>
          {/* Bottom Section */}
          <div className="flex flex-col gap-2">
            <Separator className="my-2" />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} size={"icon"}>
                  <Volume2 />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Slider
                  max={1}
                  min={0}
                  step={0.1}
                  defaultValue={[volume]}
                  onValueCommit={(value) => {
                    setVolume(value[0]);
                    beep(value[0]);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Wiki Section */}

        <div className="h-full flex-1 py-4 px-2 overflow-y-scroll">
          <Features />
        </div>
      </div>
      {loading && (
        <div className="z-100 absolute w-full h-full flex flex-col gap-4 items-center justify-center bg-primary-foreground">
          <Rings color="red" />
          <span className="text-xs ">Loading model. Please wait...</span>
        </div>
      )}
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
    if (autoRecordEnabled) {
      setAutoRecordEnabled(false);

      // Show Toast Notification
      toast.error("Autorecord Disabled");
    } else {
      setAutoRecordEnabled(true);

      // Show Toast Notification
      toast.success("Autorecord Enabled");
    }
  }

  // Inner Components

  function Features() {
    return (
      <div className="text-sm text-muted-foreground pl-2">
        <ul className="space-y-4">
          <li>
            <strong>Dark Mode</strong>
            <p>Toggle between dark mode and system theme.</p>
            <Button className="my-2 h-6 w-6" variant={"outline"} size={"icon"}>
              <Sun size={14} />
            </Button>{" "}
            /{" "}
            <Button className="my-2 h-6 w-6" variant={"outline"} size={"icon"}>
              <Moon size={14} />
            </Button>
          </li>
          <li>
            <strong>Horizontal Flip</strong>
            <p>Adjust horizontal orientation.</p>
            <Button
              className="h-6 w-6 my-2"
              variant={"outline"}
              size={"icon"}
              onClick={() => {
                setMirrored((prev) => !prev);
              }}
            >
              <FlipHorizontal size={14} />
            </Button>
          </li>
          <Separator />
          <li>
            <strong>Take Pictures</strong>
            <p>Capture snapshots at any moment from the video feed.</p>
            <Button
              className="h-6 w-6 my-2"
              variant={"outline"}
              size={"icon"}
              onClick={userPromptScreenshot}
            >
              <Camera size={14} />
            </Button>
          </li>
          <li>
            <strong>Manual Video Recording</strong>
            <p>Manually record video clips as needed.</p>
            <Button
              className="h-6 w-6 my-2"
              variant={isRecording ? "destructive" : "outline"}
              size={"icon"}
              onClick={userPromptRecord}
            >
              <Video size={14} />
            </Button>
          </li>
          <Separator />
          <li>
            <strong>Enable/Disable Auto Record</strong>
            <p>
              Option to enable/disable automatic video recording whenever
              required.
            </p>
            <Button
              className="h-6 w-6 my-2"
              variant={autoRecordEnabled ? "destructive" : "outline"}
              size={"icon"}
              onClick={toggleAutoRecord}
            >
              <PersonStanding size={14} />
            </Button>
          </li>

          <li>
            <strong>Volume Slider 🔊</strong>
            <p>Adjust the volume level of the notifications.</p>
          </li>
          <li>
            <strong>Camera Feed Highlighting 🎨</strong>
            <p>
              Highlights persons in{" "}
              <span style={{ color: "#FF0F0F" }}>red</span> and other objects in{" "}
              <span style={{ color: "#00B612" }}>green</span>.
            </p>
          </li>
        </ul>
      </div>
    );
  }
};

export default HomePage;
function resizeCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  webcamRef: React.RefObject<Webcam>
) {
  const canvas = canvasRef.current;
  const video = webcamRef.current?.video;
  if (canvas && video) {
    const { videoWidth, videoHeight } = video;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  }
}

function formatDate(date: Date) {
  const formattedDate =
    [
      (date.getMonth() + 1).toString().padStart(2, "0"),
      date.getDate().toString().padStart(2, "0"),
      date.getFullYear(),
    ].join("–") +
    " " +
    [
      date.getHours().toString().padStart(2, "0"),
      date.getMinutes().toString().padStart(2, "0"),
      date.getSeconds().toString().padStart(2, "0"),
    ].join("–");

  return formattedDate;
}
