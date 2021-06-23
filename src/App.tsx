import React from "react";
import allDay from "./data/girl-talk_oh-no.json";
import unstoppable from "./data/girl-talk_unstoppable.json";
import { MashupBreakdown } from "./MashupBreakdown";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Mashup Breakdown</h1>
      </header>
      <MashupBreakdown data={unstoppable} />
    </div>
  );
}

export default App;
