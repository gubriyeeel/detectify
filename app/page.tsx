"use client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { beep } from "@/utils/audio";
import {
  Camera,
  FlipHorizontal,
  PersonStanding,
  Video,
  Volume2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Rings } from "react-loader-spinner";
import Webcam from "react-webcam";
import { toast } from "sonner";
import * as cocossd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";
import { drawOnCanvas } from "@/utils/draw";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {};

let interval: any = null;
let stopTimeout: any = null;
const HomePage = (props: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [mirrored, setMirrored] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState<boolean>(false);
  const [volume, setVolume] = useState(0.8);
  const [model, setModel] = useState<ObjectDetection>();
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Initialize Media Recorder
  useEffect(() => {
    if (webcamRef && webcamRef.current) {
      // Firefox uses mozcaptureStream, so modify as needed
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
        mediaRecorderRef.current.onstart = (e) => {
          setIsRecording(true);
        };
        mediaRecorderRef.current.onstop = (e) => {
          setIsRecording(false);
        };
      }
    }
  }, [webcamRef]);

  useEffect(() => {
    setLoading(true);
    initModel();
  }, []);

  // Loads Model
  // Set it in a state
  async function initModel() {
    const loadedModel: ObjectDetection = await cocossd.load({
      base: "mobilenet_v2",
    });
    setModel(loadedModel);
  }

  useEffect(() => {
    if (model) {
      setLoading(false);
    }
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

      let isPerson: boolean = false;
      if (predictions.length > 0) {
        predictions.forEach((prediction) => {
          isPerson = prediction.class === "person";
        });

        if (isPerson && autoRecordEnabled) {
          startRecording(true);
        }
      }
    }
  }

  useEffect(() => {
    interval = setInterval(() => {
      runPrediction();
    }, 500);

    return () => clearInterval(interval);
  }, [webcamRef.current, model, mirrored, autoRecordEnabled, runPrediction]);

  return (
    <div className="flex flex-col relative">
      {/* Top Division - Webcam and Canvas  */}
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

      {/* Bottom Division - Controls */}
      <div className="absolute flex flex-row justify-center items-center py-2 w-full bottom-4 gap-2">
        <ThemeToggle />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={"outline"}
                size={"icon"}
                onClick={() => {
                  setMirrored((prev) => !prev);
                }}
              >
                <FlipHorizontal />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Adjust horizontal orientation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={"outline"}
                size={"icon"}
                onClick={userPromptScreenshot}
              >
                <Camera />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Take a screenshot</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size={"icon"}
                onClick={userPromptRecord}
              >
                <Video />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Start recording</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={autoRecordEnabled ? "destructive" : "outline"}
                size={"icon"}
                onClick={toggleAutoRecord}
              >
                {autoRecordEnabled ? (
                  <Rings color="white" height={45} />
                ) : (
                  <PersonStanding />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Auto-record on detect</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

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
              step={0.2}
              defaultValue={[volume]}
              onValueCommit={(val) => {
                setVolume(val[0]);
                beep(val[0]);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {loading && (
        <div className="z-100 absolute w-full h-full flex flex-row gap-4 items-center justify-center bg-primary-foreground">
          <Rings color="red" />
          <span className="text-xs ">Loading model. Please wait...</span>
        </div>
      )}
    </div>
  );

  // Handler Functions

  function userPromptScreenshot() {
    // Take a screenshot
    if (!webcamRef.current) {
      toast("Camera not found. Please refresh and try again.");
    } else {
      const imageSource = webcamRef.current.getScreenshot();
      console.log(imageSource);
      const blob = base64toBlob(imageSource);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formatDate(new Date())}.webp`;
      a.click();
    }
    // Save to downloads
  }

  function userPromptRecord() {
    if (!webcamRef.current) {
      toast("Camera is not found. Please refresh.");
    }

    if (mediaRecorderRef.current?.state == "recording") {
      // Check if current recording
      // Stop Recording
      // And save it downloads
      mediaRecorderRef.current.requestData();
      clearTimeout(stopTimeout);
      mediaRecorderRef.current.stop();
      toast("Recording saved to downloads");
    } else {
      // If not recording
      // Start recording
      startRecording(false);
    }
  }

  function startRecording(doBeep: boolean) {
    if (webcamRef.current && mediaRecorderRef.current?.state !== "recording") {
      mediaRecorderRef.current?.start();
      doBeep && beep(volume);

      stopTimeout = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.requestData();
          mediaRecorderRef.current.stop();
        }
      }, 30000);
    }
  }

  function toggleAutoRecord() {
    if (autoRecordEnabled) {
      setAutoRecordEnabled(false);
      toast("Autorecord disabled");
      // Show toast to notify user that autorecord is disabled
    } else {
      setAutoRecordEnabled(true);
      toast("Autorecord enabled");
      // Show toast to notify user that autorecord is enabled
    }
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
    ].join("-") +
    " " +
    [
      date.getHours().toString().padStart(2, "0"),
      date.getMinutes().toString().padStart(2, "0"),
      date.getSeconds().toString().padStart(2, "0"),
    ].join("-");
  return formattedDate;
}

function base64toBlob(base64Data: any) {
  const byteCharacters = atob(base64Data.split(",")[1]);
  const arrayBuffer = new ArrayBuffer(byteCharacters.length);
  const byteArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: "image/png" }); // Specify the image type here
}
