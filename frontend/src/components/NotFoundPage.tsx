import { useEffect, useState } from "react";
import "./MultiStageLoader.css";

const NOT_FOUND_JOKES = [
  "Asked the validators — they only returned a shrug opcode.",
  "Walrus storage checked twice. Only tusk selfies there.",
  "Consulted three different oracles. All said 'lol nope'.",
  "Ran a full node-wide search party. Found snacks, not pages.",
  "404? More like 400-Fore! This page sliced straight into the abyss.",
];

interface NotFoundPageProps {
  path: string;
}

export function NotFoundPage({ path }: NotFoundPageProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % NOT_FOUND_JOKES.length);
    }, 7500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loader-container">
      <div className="loader-content">
        <div className="spinner-container">
          <div className="not-found-code">404</div>
        </div>
        <h2 className="loader-title">Page lost in the mempool.</h2>
        <p className="loader-message">{NOT_FOUND_JOKES[messageIndex]}</p>
        <p className="not-found-path">
          We even double-checked <span>{path || "/"}</span>
        </p>
      </div>
    </div>
  );
}
