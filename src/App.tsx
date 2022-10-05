import React from "react";
import allDay from "./data/girl-talk_all-day.json";
import feedTheAnimals from "./data/girl-talk_feed-the-animals.json";
import nightRipper from "./data/girl-talk_night-ripper.json";
import { MashupBreakdown } from "./MashupBreakdown";

const ALBUMS = {allDay, feedTheAnimals, nightRipper};

function App() {
  return <MashupBreakdown albums={ALBUMS}/>;
}

export default App;
