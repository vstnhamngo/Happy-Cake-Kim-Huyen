// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import "@dotlottie/player-component";
import "./App.css";
import { Cake } from "./components/Cake";
import { CakeActions } from "./components/CakeActions";
import { Celebration } from "./components/Celebration";
import Joyride, { ACTIONS, CallBackProps } from "react-joyride";

// const version = import.meta.env.PACKAGE_VERSION;

const src = new URL("/assets/hbd2.mp3", import.meta.url).href;

const steps = [
  {
    target: "#name",
    content: "This is the input to enter the name.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: "#candle",
    content: "Blow on the Lightning port to extinguish the candle.",
    placement: "bottom",
  },
  {
    target: "#start",
    content: "Press start to play music and light the candle.",
    placement: "top",
  },
  {
    target: "#pause",
    content: "Press pause if you want the music to pause temporarily.",
    placement: "top",
  },
  {
    target: "#stop",
    content: "Press stop if you want to cancel temporarily.",
    placement: "top",
  },
  {
    target: "#toggle-candle",
    content: "Press button if you want to light or blow out the candle.",
    placement: "top",
  },
  {
    target: "#share",
    content: "Change the name and click 'Share' to send the gift to anyone.",
    placement: "top",
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
] as any;

const sharedSteps = [
  {
    target: "#start",
    content: "Click here",
    placement: "top",
    disableBeacon: true,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
] as any;

function App() {
  const [candleVisible, setCandleVisible] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const microphoneStreamRef = useRef<MediaStream | undefined>(undefined);

  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(false);
  const [shareMode, setShareMode] = useState(false);

  const name = "Kim Huyền";
  const [hasPlayed, setHasPlayed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [candleWasBlown, setCandleWasBlown] = useState(false);
  const [waitingForBlow, setWaitingForBlow] = useState(false); // Chờ thổi nến
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false); // Track auto play
  const [needsUserClick, setNeedsUserClick] = useState(false); // Cần user click để play
  const celebrationAudioRef = useRef<HTMLAudioElement | null>(null);

  // Refs to track latest state for blow detection
  const candleVisibleRef = useRef(candleVisible);
  const playingRef = useRef(playing);
  const candleWasBlownRef = useRef(candleWasBlown);
  const waitingForBlowRef = useRef(waitingForBlow);

  // Update refs when state changes
  useEffect(() => {
    candleVisibleRef.current = candleVisible;
  }, [candleVisible]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    candleWasBlownRef.current = candleWasBlown;
  }, [candleWasBlown]);

  useEffect(() => {
    waitingForBlowRef.current = waitingForBlow;
  }, [waitingForBlow]);

  const visibility = shareMode || playing || hasPlayed || waitingForBlow;

  const toggleLightCandle = useCallback(
    () => setCandleVisible((prevState) => !prevState),
    []
  );

  // Trigger celebration when candle is blown - using refs for latest state
  const triggerCelebration = useCallback(() => {
    if (
      candleVisibleRef.current &&
      waitingForBlowRef.current &&
      !candleWasBlownRef.current
    ) {
      setCandleVisible(false);
      setCandleWasBlown(true);
      setWaitingForBlow(false);
      setShowCelebration(true);

      // Play celebration sound
      if (celebrationAudioRef.current) {
        celebrationAudioRef.current.play();
      }
    }
  }, []);

  const hideCelebration = useCallback(() => {
    setShowCelebration(false);
    setHasPlayed(true);
  }, []);

  const blowCandles = useCallback(
    async (stream: MediaStream) => {
      try {
        microphoneStreamRef.current = stream;

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.fftSize = 2048;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const detectBlow = () => {
          analyser.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
          const threshold = 43;

          if (average > threshold) {
            triggerCelebration();
          }
        };

        setInterval(detectBlow, 100);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    },
    [triggerCelebration]
  );

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { action } = data;
      if (action === ACTIONS.RESET || action === ACTIONS.CLOSE) {
        setRun(false);
      }
    },
    [setRun]
  );

  const onEnded = useCallback(() => {
    setPlaying(false);
    setWaitingForBlow(true); // Nhạc kết thúc, chờ thổi nến
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        if (stream) {
          blowCandles(stream);
        }
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    })();

    return () => {
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [blowCandles]);

  useLayoutEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sharedParam = urlParams.get("shared");
    if (sharedParam) {
      setCandleVisible(true);
      setShareMode(true);
    }
  }, []);

  // Autoplay when component mounts
  useEffect(() => {
    const tryAutoPlay = () => {
      if (hasAutoPlayed || !audioRef.current) return;

      setHasAutoPlayed(true);

      audioRef.current
        .play()
        .then(() => {
          setPlaying(true);
          setCandleVisible(true);
        })
        .catch((error) => {
          console.log("Autoplay blocked:", error);
          setNeedsUserClick(true);
        });
    };

    // Wait a bit for the audio element to be ready
    const timer = setTimeout(tryAutoPlay, 100);
    return () => clearTimeout(timer);
  }, [hasAutoPlayed]);

  // Handle user click to start
  const handleStartClick = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current
      .play()
      .then(() => {
        setPlaying(true);
        setCandleVisible(true);
        setNeedsUserClick(false);
      })
      .catch((e) => {
        console.error("Error playing audio:", e);
      });
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        justifyContent: "space-between",
        // border: "1px solid red",
      }}
    >
      <Joyride
        styles={{
          options: {
            zIndex: shareMode ? 10000 : -10000,
          },
          buttonSkip: {
            outline: 0,
          },
          buttonNext: {
            outline: 0,
          },
          buttonBack: {
            outline: 0,
          },
          buttonClose: {
            outline: 0,
          },
        }}
        steps={sharedSteps}
        run={run}
        showSkipButton
        continuous
        callback={handleJoyrideCallback}
        hideBackButton
        hideCloseButton
        showProgress
        spotlightClicks
      />
      <Joyride
        styles={{
          options: {
            zIndex: !shareMode ? 10000 : -10000,
          },
          buttonSkip: {
            outline: 0,
          },
          buttonNext: {
            outline: 0,
          },
          buttonBack: {
            outline: 0,
          },
          buttonClose: {
            outline: 0,
          },
        }}
        steps={steps}
        run={run}
        showSkipButton
        continuous
        callback={handleJoyrideCallback}
        hideBackButton
        hideCloseButton
        showProgress
        spotlightClicks
      />

      <audio {...{ src, ref: audioRef, preload: "auto", onEnded }} />

      {/* Click to start overlay */}
      {needsUserClick && (
        <div
          onClick={handleStartClick}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 200, 200, 0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              fontSize: "clamp(3rem, 8vw, 6rem)",
              marginBottom: "1rem",
            }}
          >
            🎂
          </div>
          <div
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              color: "#ff6b6b",
              textAlign: "center",
              padding: "0 1rem",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            Bấm để bắt đầu 🎉
          </div>
        </div>
      )}

      <div>
        {/* Display name */}
        {(playing || hasPlayed || waitingForBlow) && (
          <div
            style={{
              position: "absolute",
              top: "18%",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "90vw",
              maxWidth: "400px",
              zIndex: 50,
              padding: "10px",
            }}
          >
            <span
              style={{
                fontFamily: "'Montserrat', cursive",
                fontWeight: 700,
                fontSize: "clamp(1.8rem, 8vw, 3rem)",
                color: "#ff8c00",
                textAlign: "center",
                textShadow:
                  "0 2px 4px rgba(255, 140, 0, 0.4), 0 0 15px rgba(255, 215, 0, 0.5)",
                letterSpacing: "2px",
                animation: "floatName 4s ease-in-out infinite",
              }}
            >
              {name}
            </span>
            {/* Thông báo thổi nến */}
            {waitingForBlow && (
              <div
                style={{
                  marginTop: "15px",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Dancing Script', cursive",
                    fontWeight: 700,
                    fontSize: "clamp(1.2rem, 5vw, 1.8rem)",
                    color: "#ff8c00",
                    textShadow:
                      "0 0 10px rgba(255, 140, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.4)",
                    textAlign: "center",
                  }}
                >
                  🎂 Hãy thổi nến đi! 🎂
                </span>
              </div>
            )}
          </div>
        )}
        <Cake {...{ candleVisible }} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(400px, 100vw)",
        }}
      >
        <dotlottie-player
          src="/assets/hbd.lottie"
          autoplay
          loop
          style={{
            zIndex: 20,
            visibility: visibility ? "visible" : "hidden",
            width: "100%",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(400px, 100vw)",
        }}
      >
        <dotlottie-player
          src="/assets/confetti.lottie"
          autoplay
          loop
          style={{
            zIndex: 30,
            visibility: visibility ? "visible" : "hidden",
            width: "100%",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "1.25%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <CakeActions
          {...{
            run,
            toggleLightCandle,
            setRun,
            playing,
            candleVisible,
          }}
        />
      </div>

      {/* Celebration audio */}
      <audio
        ref={celebrationAudioRef}
        src="/assets/korea-hbd.mp3"
        preload="auto"
      />

      {/* Celebration overlay */}
      <Celebration
        show={showCelebration}
        name={name}
        onHide={hideCelebration}
      />

      {/* <div
        style={{
          position: "absolute",
          bottom: "0%",
          left: "50%",
          transform: "translateX(-50%)",
          display: "non",
        }}
      >
        {version}
      </div> */}
    </div>
  );
}

export default App;
