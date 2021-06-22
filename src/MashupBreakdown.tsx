import { useEffect, useMemo, useState } from "react";
import { usePlayer } from "./hooks/usePlayer";
import { clamp } from "./util/clamp";
import { secondsToTime } from "./util/secondsToTime";

export interface Sample {
  start: number;
  end: number;
  artist: string;
  title: string;
}

export interface Track {
  title: string;
  offset: number;
  samples: Sample[];
}

export interface Mashup {
  filename: string;
  tracks: Track[];
}

export interface MashupBreakdownProps {
  data: Mashup;
}

export function MashupBreakdown({ data }: MashupBreakdownProps) {
  const tracks = useMemo(() => {
    return data.tracks.reduce<
      Array<{ title: string; start: number; end: number; length: number }>
    >((out, track) => {
      const last = out.slice(-1)[0];
      const length = Math.max(...track.samples.map((x) => x.end));
      const start = last ? last.end : 0;
      const end = start + length;
      out.push({
        title: track.title,
        start,
        end,
        length,
      });
      return out;
    }, []);
  }, [data]);

  const samples = useMemo<Array<Sample & { idx: number }>>(() => {
    return data.tracks
      .flatMap((track) => {
        return track.samples.map((sample) => ({
          ...sample,
          start: track.offset + sample.start,
          end: track.offset + sample.end,
        }));
      })
      .map((sample, idx) => ({ ...sample, idx }));
  }, [data]);

  const totalLength = useMemo(
    () => tracks.reduce((sum, x) => sum + x.length, 0),
    [tracks]
  );
  const [zoom] = useState(10); // seconds to show in the sliding window
  const player = usePlayer(totalLength);
  const seek = player.currentSeek();

  useEffect(() => {
    if (player.playing) {
      const id = setInterval(player.update, 100);
      return () => {
        clearInterval(id);
      };
    }
  }, [player.playing, player.update]);

  const windowStart = seek - zoom / 2;
  const windowEnd = seek + zoom / 2;
  const lowResStart = Math.floor(windowStart);
  const lowResEnd = Math.floor(windowEnd);

  const inViewTracks = useMemo(() => {
    return tracks.filter(
      (track) =>
        (track.start <= lowResEnd && track.end >= lowResStart) ||
        (track.end >= lowResStart && track.start <= lowResEnd)
    );
  }, [tracks, lowResStart, lowResEnd]);

  const inViewSamples = useMemo(() => {
    return samples.filter(
      (sample) =>
        (sample.start <= lowResEnd && sample.end >= lowResStart) ||
        (sample.end >= lowResStart && sample.start <= lowResEnd)
    );
  }, [samples, lowResStart, lowResEnd]);

  return (
    <>
      <nav>
        <button onClick={player.toggle}>
          {player.playing ? "pause" : "play"}
        </button>
        {secondsToTime(seek)}
      </nav>
      <div className="seek-window">
        <div className="seek-tracks">
          {inViewTracks.map((track) => {
            const active = track.start <= seek && track.end >= seek;
            const start = Math.max(windowStart, track.start);
            const end = Math.min(windowEnd, track.end);
            const width = ((end - start) / zoom) * 100;

            return (
              <div
                key={track.title}
                style={{ width: `${width}%` }}
                className={["sample track", active && "active"]
                  .filter(Boolean)
                  .join(" ")}
              >
                {track.title}
              </div>
            );
          })}
        </div>
        <div className="seek-samples">
          {inViewSamples.map((sample) => {
            const active = sample.start <= seek && sample.end >= seek;
            const left =
              sample.start <= windowStart
                ? 0
                : clamp(0, 100, ((sample.start - windowStart) / zoom) * 100);

            const right =
              sample.end >= windowEnd
                ? 0
                : clamp(0, 100, ((windowEnd - sample.end) / zoom) * 100);

            return (
              <div
                key={sample.idx}
                style={{ marginLeft: `${left}%`, marginRight: `${right}%` }}
                className={["sample", active && "active"]
                  .filter(Boolean)
                  .join(" ")}
              >
                {sample.artist},
                <br />
                {sample.title}
                <br />
                <small>
                  {secondsToTime(sample.start)} - {secondsToTime(sample.end)}
                </small>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
