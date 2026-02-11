import { useStore } from "@nanostores/react";
import { $phase } from "@/stores/gameStore";
import Landing from "./Landing";
import Setup from "./Setup";
import GameBoard from "./GameBoard";
import Results from "./Results";

export default function App() {
  const phase = useStore($phase);

  return (
    <div className="h-full flex flex-col">
      {phase === "landing" && <Landing />}
      {phase === "setup" && <Setup />}
      {phase === "playing" && <GameBoard />}
      {phase === "results" && <Results />}
    </div>
  );
}
