import React from "react";
import allDay from "./data/girl-talk_oh-no.json";
import feedTheAnimals from "./data/girl-talk_feed-the-animals.json";
import nightRipper from "./data/girl-talk_night-ripper.json";
import { MashupBreakdown } from "./MashupBreakdown";

function App() {
  return (
    <div className="App">
      <MashupBreakdown data={nightRipper} />
    </div>
  );
}

export default App;
