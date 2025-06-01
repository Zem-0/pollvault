/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { FaAngleRight } from "react-icons/fa6";
import { FaChevronDown, FaTimes } from "react-icons/fa";
import Confetti from "confetti-react";
import { RiDownloadCloudFill } from "react-icons/ri";
import {
  getInstructions,
  getFirstQuestion,
  getNextQuestion,
  sendFeedback,
  recordSurveyVisit,
} from "@/app/api/conversation/conversation";
import { Question } from "@/app/types/Conversation/Conversation_Types";
import { QuestionTypes } from "@/constants/enums/QuestionTypes/QuestionTypes";
import {
  prevConversation,
  setSurveyCode,
  startTheConversation,
  toogleConversationType,
} from "@/lib/features/conversation/conversationSlice";
import { RootState } from "@/lib/store";

import Instructions from "./components/Instructions";
import Preference from "./components/Preference";
import Reference from "./components/Reference";
import SpeechComponent from "./components/SpeechComponent";
import Link from "next/link";
import Text from "@/components/ui/Texts/Text";
import Button from "@/components/ui/buttons/Button";
import { CheckRegistraction } from "@/app/api/auth";
import ChatLoader from "@/components/ChatLoader";
import WaitlistForm from "./components/WaitlistForm";
import RenderRating from "@/app/polls/[pollid]/components/RatingComponent/RenderRating";
import ConversationInput from "./components/ConversationInput";
import AttachmentComponent from "./components/AttachmentComponent";
import MobileSideMenu from "./components/MobileSideMenu";
import ConversationQuestionComponent from "./components/ConversationQuestionComponent";

interface PageProps {
  params: any;
}

type Introductions = {
  title: string;
  instruction: string;
  introduction: string;
  totalquestion: string;
  totaltime: string;
};

const Page: React.FC<PageProps> = ({ params }) => {
  const dispatch = useDispatch();

  const conversation = useSelector((state: RootState) => state.conversation);
  //this is for mobile phone
  const [activeLink, setActiveLink] = useState<string>("poll");
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [uniqueId, setUniqueId] = useState<string>(uuidv4());
  const [startPoll, setStartPoll] = useState<boolean>(false);
  const [intro, setIntro] = useState(false);
  const [profile, setProfile] = useState(false);
  const [feedBack, setFeedback] = useState("");
  const [conversationEndRef, setConversationEndRef] = useState<HTMLDivElement | null>(null);
  const [scrollableContainerRef, setScrollableContainerRef] = useState<HTMLDivElement | null>(null);
  const [isStartPollLoading, setIsStartPollLoading] = useState(false);
  const [attachment, setAttachment]: any = useState(null);
  const [isAssestPopupOpen, setIsAssestPopupOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [feedBacks] = useState([
    { name: "loved", value: "Loved it", icon: "❤️❤️", selectedIcon: "🤍🤍" },
    { name: "liked", value: "Liked it", icon: "😊", selectedIcon: "😊" },
    { name: "disliked", value: "Boo...", icon: "😫", selectedIcon: "😫" },
  ]);
  const [introductions, setIntroductions] = useState<Introductions>({
    title: "",
    instruction: "",
    introduction: "",
    totalquestion: "",
    totaltime: "",
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLogIn, setIsLogIn] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [stopSurvey, setStopSurvey] = useState(false);

  // State and refs for voice recording
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceSurveyCode, setVoiceSurveyCode] = useState('350906'); // Hardcoded survey code
  const [responderId, setResponderId] = useState('');
  const [audioBars, setAudioBars] = useState(Array(12).fill(0));

  // State for voice survey progress and time
  const [voiceProgress, setVoiceProgress] = useState(0); // 0-100
  const [voiceTimeRemaining, setVoiceTimeRemaining] = useState<number>(0); // in minutes or seconds, adjust as needed

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setUniqueId(uuidv4());
  }, []);

  useEffect(() => {
    async function GetInstructions() {
      try {
        const response = await getInstructions(
          params.conversation_id,
          uniqueId
        );

        if (response?.status == 200) {
          setIntroductions(response.data);
        }
        dispatch(setSurveyCode({ survey_code: params.conversation_id }));
      } catch (err) {
        console.log(err);
      }
    }
    GetInstructions();
  }, [dispatch, params.conversation_id, uniqueId]);

  useEffect(() => {
    const recordVisit = async () => {
      // Get or create visitor ID from localStorage
      let visitorId = localStorage.getItem("pollvault_visitor_id");
      if (!visitorId) {
        visitorId = uuidv4();
        localStorage.setItem("pollvault_visitor_id", visitorId);
      }

      try {
        await recordSurveyVisit(params.conversation_id, visitorId);
      } catch (error) {
        console.error("Error recording visit:", error);
      }
    };

    recordVisit();
  }, [params.conversation_id]); // Only run when conversation_id changes

  // WebSocket and Audio Logic from ws_voice.js

  useEffect(() => {
    // Generate random responder ID if not already set (though ws_voice uses a fixed one initially)
    // For now, let's use the uniqueId from the conversation state
    setResponderId(uniqueId);

    return () => {
      disconnect();
    };
  }, [uniqueId]); // Depend on uniqueId

  const connect = async () => {
    try {
      console.log('Attempting to connect to voice survey WebSocket...');
      // Use the hardcoded base URL for the WebSocket connection
      const wsUrl = `ws://localhost:8002/survey/voice/${voiceSurveyCode}?responder_id=${responderId}`;
      console.log(`WebSocket URL: ${wsUrl}`);

      console.log('Attempting to create new WebSocket instance...');
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully!');
        setIsConnected(true);
      };

      wsRef.current.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          // Handle audio data
          const audioBlob = new Blob([event.data], { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();

          // Animate audio bars when receiving audio
          animateAudioBars();
        } else {
          // Handle JSON messages
          const data = JSON.parse(event.data);
          console.log('Received message:', data);

          if (data.content) {
            // Display the message in the conversation history or elsewhere
            // For now, let's just log it and potentially update a state variable if needed
            console.log('Received message content:', data.content);
            // You might want to add this message to the conversation history state
            // setConversationHistory(prev => [...prev, { question: data.content, answer: '', type: QuestionTypes.FREE_TEXT }]); // Example, adjust structure
          }

          // Update progress and time based on message type
          if (data.type === 'question' || data.type === 'audio_question') {
            // Assuming backend sends progress and time in the message
            if (data.progress !== undefined) {
               setVoiceProgress(data.progress);
            }
            if (data.timeRemaining !== undefined) { // Assuming backend sends timeRemaining
               setVoiceTimeRemaining(data.timeRemaining);
            }
             // If the backend doesn't send progress/time per question, we might need client-side tracking
             // For now, let's assume backend sends it.
          }

           if (data.type === 'survey_complete') {
             // Handle survey completion for voice interface
             console.log('Voice survey complete');
             setVoiceProgress(100);
             setVoiceTimeRemaining(0);
             stopRecording(); // Stop recording when survey is complete
             // Keep the connection open briefly to send final data if needed, then disconnect
             setTimeout(() => disconnect(), 1000); // Disconnect after a short delay
           }
           // Potentially handle other message types like 'error', 'instruction', etc.
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
        setIsConnected(false);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error during WebSocket connection attempt:', error);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    // stopRecording(); // Stop recording is called before disconnect on survey_complete
    setIsConnected(false);
    setVoiceProgress(0); // Reset progress on disconnect
    setVoiceTimeRemaining(0); // Reset time on disconnect
    // Optionally show a thank you message or redirect
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio context for visualization
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 64;

      // Start visualization
      visualizeAudio();

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendAudioData(audioBlob);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      // Check if the context is in a valid state before closing
       if (audioContextRef.current.state !== 'closed') {
           audioContextRef.current.close();
       }
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsRecording(false);
    setIsPaused(false);
    setAudioBars(Array(12).fill(0));
    // Do not reset progress or time here, as stopping recording doesn't end the survey
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const sendAudioData = (audioBlob: Blob) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      audioBlob.arrayBuffer().then(buffer => {
        wsRef.current?.send(buffer);
      });
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const animate = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Create bars based on frequency data
      const bars: number[] = [];
      const barCount = 12;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255;
        bars.push(value);
      }

      setAudioBars(bars);
      setAudioLevel(Math.max(...bars)); // You might use audioLevel for something else, like a visual indicator

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const animateAudioBars = () => {
    // Simulate audio visualization when receiving audio
    let frame = 0;
    const animate = () => {
      const bars = Array(12).fill(0).map(() =>
        Math.random() * 0.8 + 0.2
      );
      setAudioBars(bars);

      frame++;
      if (frame < 30) { // Animate for about 1 second
        // Using setTimeout with requestAnimationFrame to control duration more predictably
        setTimeout(() => requestAnimationFrame(animate), 33);
      } else {
        setAudioBars(Array(12).fill(0));
      }
    };
    animate();
  };

  const sendTextMessage = (message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text_message',
        content: message
      }));
    }
  };

  function toogleIntro() {
    setIntro((prev) => !prev);
    if (menuOpen) setMenuOpen(false);
  }

  function toogleProfile() {
    setProfile((prev) => !prev);
    if (menuOpen) setMenuOpen(false);
  }

  async function handleFeedback(feedback: string) {
    setFeedback(feedback);
    setShowConfetti(true);

    // Automatically reset confetti after 4 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 4000);
    try {
      const response = await sendFeedback(
        params.conversation_id,
        uniqueId,
        feedback
      );
      if (response?.status == 200) {
      }
    } catch (err) {
      console.log(err);
    } finally {
      // setShowPopup(true);
    }
  }

  const restartSurvey = () => {
    window.location.reload();
  };

  const toggleMenu = () => {
    setMenuOpen((pre) => !pre);
  };

  // Function to determine if the asset is an image
  // const isImageAsset = (url : any) => {
  //   return url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  // };
  const isImage = (contentType: any) => {
    return typeof contentType === "string" && contentType.startsWith("image/");
  };

  //check for login
  useEffect(() => {
    const checkLogin = async () => {
      const access_token = localStorage.getItem("access_token");
      if (access_token) {
        try {
          const isValid = await CheckRegistraction(access_token); // Ensure this is async
          setIsLogIn(isValid);
        } catch (error) {
          console.error("Error validating access token:", error);
          setIsLogIn(false);
        }
      }
    };

    checkLogin();
  }, []);

  // useEffect to handle countdown of voiceTimeRemaining if needed (depends on backend sending total time initially)
  // If backend sends remaining time in messages, this might not be necessary.
  // This effect will run if voiceTimeRemaining is set > 0 by a WebSocket message.
  useEffect(() => {
    if (isConnected && voiceTimeRemaining > 0) {
      const timerId = setInterval(() => {
        setVoiceTimeRemaining(prevTime => Math.max(0, prevTime - 1));
      }, 1000 * 60); // Assuming timeRemaining is in minutes
      return () => clearInterval(timerId);
    }
     // Clear interval if component unmounts or dependencies change such that countdown is not needed
     return () => { /* No cleanup needed here if timerId is not set */ };
  }, [isConnected, voiceTimeRemaining]); // Depend on isConnected and voiceTimeRemaining

  return (
    <>
      {/* {startPoll == true && <Preference />} */}
      <div className="min-h-svh relative md:bg-Neutral  flex flex-col  overflow-hidden">
        {showConfetti && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            gravity={0.3}
            recycle={false}
            numberOfPieces={400}
            style={{
              zIndex: 100,
            }}
          />
        )}

        <div className="w-full hidden lg:flex flex-row px-5 lg:px-8 py-5 justify-between">
          <Link href={"/"}>
            <div className="w-[140px]">
              <img src="/pollvault.svg" alt="icon" />
            </div>
          </Link>
          {/* <div className="relative flex flex-row gap-2 items-center justify-center">
            <Link href="/signup" target="_blank">
              <Text variant="body13R" extraCSS="text-primaryBlue">
                Sign in
              </Text>
            </Link>
            <span className="w-[2px] h-[20px] bg-gray-400 rounded-3xl"></span>
            <Text variant="body13R" extraCSS="text-textGray">
              New here?
            </Text>
            <Link href="/signup" target="_blank">
              <Text variant="body13R" extraCSS="text-primaryBlue">
                Sign up
              </Text>
            </Link>
          </div> */}
        </div>

        <div className="w-full h-svh lg-h-full flex flex-1 items-center justify-center ">
          {/* <div className="relative w-full h-auto lg:w-1/3 xl:w-1/4 2xl:w-1/5 "> */}
          <div className="relative w-full h-svh lg:h-auto lg:w-1/5 lg:max-w-[400px] lg:min-w-[350px]">
            <Instructions
              intro={intro}
              toogleIntro={toogleIntro}
              introductions={introductions}
              startPoll={startPoll}
            />

            {/* Simplifying rendering logic to only show voice interface when startPoll is true */}
            {startPoll ? (
                <div className="relative z-30 shadow-xl bg-slate-900 w-full flex flex-col gap-2 justify-between h-svh lg:h-[650px]  overflow-hidden p-5 lg:rounded-2xl lg:translate-y-[-2rem] lg:border lg:border-Yellow">
                {/* for restarting the survey - keeping this popup just in case, though its name is misleading */}
                  {showPopup && (
                    <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 backdrop-blur-sm z-50">
                      <div className="relative bg-white rounded-lg shadow-lg p-6 pt-4 w-[85%]">
                        {/* Close Icon */}
                        <button
                          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                          onClick={() => setShowPopup(false)} // Close the popup
                        >
                          <FaTimes size={18} />
                        </button>

                        <h2 className="text-lg font-bold text-[#183D81]">
                          Restart Survey
                        </h2>
                        <p className="text-sm text-gray-600 my-2">
                          Would you like to restart the survey and share more
                          insights?
                        </p>
                        <Button
                          type="gradient"
                          label="Restart Survey"
                          onClick={restartSurvey} // This will reload the page
                          customCss=""
                        />
                      </div>
                    </div>
                  )}

                  {/* End Survey Confirmation Popup */}
                  {stopSurvey && (
                    <div className="fixed inset-0 flex items-center justify-center  bg-opacity-50 backdrop-blur-sm z-50">
                      <div className="bg-white rounded-lg shadow-lg p-6 w-[85%]">
                        <h2 className="text-lg font-bold text-[#183D81]">
                          End Survey
                        </h2>
                        <p className="text-sm text-gray-600 my-2">
                          Leaving so soon 🙁!! If you can spare a minute, I have
                          just a few more questions for you.
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-4">
                          <Button
                            type="primaryWhite"
                            label="End"
                            customCss=""
                            onClick={restartSurvey} // End goes to the welcome page (reloads)
                          />
                          <Button
                            type="gradient"
                            label="Continue"
                            onClick={() => setStopSurvey(false)} // Continue closes the popup
                            customCss=""
                          />
                        </div>
                      </div>
                    </div>
                  )}

                {/* Top bar for voice interface */}
                <div className=" flex flex-row items-center justify-between">
                  <div
                    className="cursor-pointer lg:hidden"
                    onClick={toggleMenu}
                  >
                    <img
                      src="/images/conversation/menuIcon.svg"
                      alt="icon"
                    />
                  </div>
                  <div className="flex items-center ">
                    <div className="flex-shrink-0 w-[100px] overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-Golden"
                        style={{ width: `${voiceProgress}%` }}
                      />
                    </div>
                    <div className="ml-2 text-Golden">
                       {/* Displaying voice survey progress and time */}
                      <p className="text-Golden text-exsm font-medium flex items-center justify-center">
                        {voiceProgress}%{" "}
                        <span className="px-2 font-bold text-2xl">
                          ·
                        </span>{" "}
                        {voiceTimeRemaining} min
                      </p>
                    </div>
                  </div>
                  {/* Top bar stop button - linked to voice disconnect */}
                  {/* Linking to setStopSurvey(true) to show the confirmation popup */}
                  <button
                    className=" cursor-pointer p-1.5 bg-red-100 rounded-md lg:ml-auto"
                    onClick={() => setStopSurvey(true)}
                  >
                    <img src="/images/conversation/go.svg" alt="icon" />
                  </button>
                </div>

                 {/* Introductory Text before recording */}
                 {!isRecording && (
                   <div className="flex flex-col items-center justify-center text-center text-white text-lg px-4 py-8">
                     <p>Thank you for taking time today.</p>
                     <p>I would like take 5 mins of your time to get your thoughts about Pollvault.</p>
                   </div>
                 )}

                 {/* Content area, might contain messages or instructions */}
                 {/* Ensure ref is correctly applied with type assertion */}
                 <div ref={scrollableContainerRef as any} className="overflow-y-scroll no-scrollbar pt-4">
                    {/* You might want to display messages from the WebSocket here */}
                    {/* Example: */}
                    {/* {voiceMessages.map((msg, index) => <div key={index}>{msg.content}</div>)} */}
                 </div>

                {/* Audio Visualization */}
                <div className="flex items-end justify-center space-x-1 h-20 mb-4">
                  {audioBars.map((bar, index) => (
                    <div
                      key={index}
                      className="w-3 rounded-full bg-gradient-to-t from-purple-500 to-blue-500"
                      style={{
                        height: `${Math.max(bar * 80, 4)}px`,
                        opacity: bar > 0 ? 1 : 0.3,
                        transition: 'height 0.1s ease, opacity 0.1s ease'
                      }}
                    />
                  ))}
                </div>

                {/* Static buttons */}
                <div className="flex justify-center items-center space-x-4 py-4">
                  {/* Aa button */}
                  <button className="w-12 h-12 rounded-full bg-gray-800 border border-white flex items-center justify-center text-white text-lg">
                    Aa
                  </button>

                  {/* Rewind button (Skip) */}
                  <button
                    onClick={() => sendTextMessage("Skip")}
                    disabled={!isConnected || isRecording} // Disable if not connected or currently recording audio
                    className={`w-12 h-12 rounded-full border border-white flex items-center justify-center text-white text-2xl ${!isConnected || isRecording ? 'bg-gray-700 opacity-50 cursor-not-allowed' : 'bg-gray-800 cursor-pointer'}`}
                  >
                    &#x23EE;
                  </button>

                  {/* Main Record/Pause Button */}
                  <button
                    onClick={() => {
                      if (!isConnected) return; // Should ideally connect first

                      if (isRecording) {
                        if (isPaused) {
                          resumeRecording();
                        } else {
                          pauseRecording();
                        }
                      } else {
                        startRecording();
                      }
                    }}
                    disabled={!isConnected} // Disable if not connected
                    className={`w-16 h-16 rounded-full border flex items-center justify-center text-3xl
                      ${!isConnected ? 'bg-gray-700 border-gray-500 text-gray-400 cursor-not-allowed' : isRecording && !isPaused ? 'bg-white border-white text-purple-800 animate-pulse' : 'bg-gray-300 border-white text-purple-800 cursor-pointer'}
                    `}
                  >
                    {isRecording ? (isPaused ? '▶' : '⏸') : '🎤'} {/* Use icons instead of text? */}
                  </button>

                  {/* Refresh button (Restart) */}
                  <button
                    onClick={() => {
                      stopRecording();
                      // Reset other relevant state if needed for a full restart
                      // setProgress(0); // Assuming you add a progress state
                      // setCurrentMessage("Ready to start..."); // Assuming you add a message state
                    }}
                     disabled={!isRecording && !isPaused} // Only enabled if recording or paused
                    className={`w-12 h-12 rounded-full border border-white flex items-center justify-center text-white text-2xl ${!isRecording && !isPaused ? 'bg-gray-700 opacity-50 cursor-not-allowed' : 'bg-gray-800 cursor-pointer'}`}
                  >
                    &#x23F1;
                  </button>

                  {/* Stop button (Red) */}
                  <button
                    onClick={stopRecording} // This button calls the stopRecording function
                    disabled={!isRecording && !isPaused} // It is enabled only when recording or paused
                    className={`w-12 h-12 rounded-full bg-red-600 flex items-center justify-center ${!isRecording && !isPaused ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                     <div className="w-5 h-5 bg-white rounded-sm"></div>
                  </button>
                </div>

                 {/* Add a connect button for initial connection if not connected */}
                 {!isConnected && (
                    <button
                      onClick={connect}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md"
                    >
                      Connect to Voice Survey
                    </button>
                 )}

              </div>
            ) : (
              // Initial state before starting the poll
              <div className="relative z-30 shadow-xl bg-slate-900 w-full flex flex-col gap-2 justify-between h-svh lg:h-[650px]  overflow-hidden p-5 lg:rounded-2xl lg:translate-y-[-2rem] lg:border lg:border-Yellow">
                      <div>
                        <div>
                          <div aria-hidden="true">
                            <div className="relative flex flex-row gap-2 items-center">
                              <div className="lg:hidden">
                                <img src="/purpleSmallLogo.svg" alt="icon" />
                              </div>
                              <div className="flex flex-row ml-auto lg:ml-0">
                                <div>
                                  <img
                                    src="/images/respondent/question.svg"
                                    alt="icon"
                                  />
                                </div>
                                <div className="pl-2 text-exsm  text-Golden">
                                  {introductions?.totalquestion || 0} ques
                                </div>
                              </div>
                              <div className="flex flex-row">
                                <div>
                                  <img
                                    src="/images/respondent/time.svg"
                                    alt="icon"
                                  />
                                </div>
                                <div className="pl-2 text-exsm text-Golden">
                                  {introductions?.totaltime || 0} mins
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Text
                        variant="h2"
                        extraCSS="text-gray-200 capitalize font-medium my-3 leading-9"
                      >
                        {introductions.title || "Welcome to Survey!"}
                      </Text>

                      <div className="text-white text-msm font-normal">
                        <p className="text-[16px] font-normal leading-[22px] text-white">
                          <span className="mb-2 block">Hi!</span>
                          {introductions.introduction
                            ? introductions.introduction.length > 150
                              ? introductions.introduction.slice(0, 150) + "..."
                              : introductions.introduction
                            : "We're excited to hear from you."}
                        </p>
                        <p className="text-[16px] font-normal leading-[22px] text-white my-2">
                          This survey should take about some
                          {introductions?.totaltime} minutes let's begin! ✨.
                        </p>
                      </div>

                      <div className="w-full flex flex-col flex-grow justify-end ">
                        <div className="lg:relative">
                          <Button
                            label="Start"
                            type="gradient"
                            customCss="rounded-xl w-full"
                            onClick={() => {
                              connect(); // Call connect instead of startConversation
                              setStartPoll(true); // Set startPoll to true to show voice interface
                            }}
                            clickAnimation={true}
                            loading={isStartPollLoading} // Keep loading state for the button click
                          />
                        </div>
                      </div>
                </div>
            )}

            <Reference profile={profile} toogleProfile={toogleProfile} />
          </div>
        </div>
        {/* mobile side menu */}
        <MobileSideMenu
          menuOpen={menuOpen}
          toggleMenu={toggleMenu}
          activeLink={activeLink}
          setActiveLink={setActiveLink}
          toogleIntro={toogleIntro}
          toogleProfile={toogleProfile}
          isLogIn={isLogIn}
        />
      </div>
    </>
  );
};

export default Page;
