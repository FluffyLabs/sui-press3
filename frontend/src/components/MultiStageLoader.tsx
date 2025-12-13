import { useEffect, useState } from "react";
import "./MultiStageLoader.css";

interface LoadingStage {
  title: string;
  messages: string[];
}

const LOADING_STAGES: Record<string, LoadingStage> = {
  pages: {
    title: "Summoning the blockchain spirits...",
    messages: [
      "Asking politely for the pages...",
      "Bribing the validators with gas fees...",
      "Decentralizing the loading bar...",
      "Consulting the oracle (not that Oracle)...",
      "Waiting for consensus on what to load...",
    ],
  },
  content: {
    title: "Fetching from the Walrus dimension...",
    messages: [
      "Teaching walruses to fetch...",
      "Swimming through decentralized storage...",
      "Defrosting the data igloos...",
      "Asking the walrus nicely...",
      "Waiting for the walrus to wake up...",
    ],
  },
};

interface MultiStageLoaderProps {
  stage: "pages" | "content";
}

export function MultiStageLoader({ stage }: MultiStageLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const currentStage = LOADING_STAGES[stage];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % currentStage.messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentStage.messages.length]);

  return (
    <div className="loader-container">
      <div className="loader-content">
        <div className="spinner-container">
          <div className="spinner" />
          <div className="spinner-ring" />
        </div>
        <h2 className="loader-title">{currentStage.title}</h2>
        <p className="loader-message">{currentStage.messages[messageIndex]}</p>
        <div className="loader-dots">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>
    </div>
  );
}
