import React from "react";
import allDay from "./data/girl-talk_oh-no.json";
import { MashupBreakdown } from "./MashupBreakdown";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Mashup Breakdown</h1>
      </header>
      <MashupBreakdown data={allDay} />
    </div>
  );
}

export default App;
