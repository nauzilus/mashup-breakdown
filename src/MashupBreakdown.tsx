import { useCallback, useEffect, useMemo, useState } from "react";
import ReactPlayer from "react-player";
import styled from "styled-components";
import { usePlayer } from "./hooks/usePlayer";
import { clamp } from "./util/clamp";
import { secondsToTime } from "./util/secondsToTime";
import { useLocalStorage } from "./hooks/useLocalStorage";

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
  artist: string;
  title: string;
  url: string;
  source: string;
  tracks: Track[];
}

export interface MashupBreakdownProps {
  albums: Record<string, Mashup>;
}

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  > main {
    flex-grow: 1;
    background-color: ghostwhite;
  }
  > footer {
    display: flex;
    justify-content: space-between;
    padding: 1em 0.5rem;
    font-size: 0.8em;
    border-top: 1px solid;
    border-color: lightgray;
    background-color: crimson;
    color: white;
    a {
      color: white;
      margin: 0 0.5em;
    }
  }
`;

export function MashupBreakdown({ albums }: MashupBreakdownProps) {
  const [selected, setSelected] = useLocalStorage('mubd-album', Object.keys(albums)[0]);
  const album = albums[selected];

  const tracks = useMemo(() => {
    return album.tracks.reduce<
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
  }, [album]);

  const samples = useMemo<Array<Sample & { idx: number }>>(() => {
    return album.tracks
      .flatMap((track) => {
        return track.samples.map((sample) => ({
          ...sample,
          start: track.offset + sample.start,
          end: track.offset + sample.end,
        }));
      })
      .map((sample, idx) => ({ ...sample, idx }));
  }, [album]);

  const [duration, setDuration] = useState(0);
  const [zoom] = useState(20); // seconds to show in the sliding window
  const [rp, setRp] = useState<ReactPlayer | null>(null);
  const player = usePlayer(duration);
  const currentSeek = player.currentSeek();
  const seek = player.seek;

  const onProgress = useCallback(
    (data: { playedSeconds: number }) => {
      seek(data.playedSeconds);
    },
    [seek]
  );

  useEffect(() => {
    if (player.playing) {
      const id = setInterval(player.update, 100);
      return () => {
        clearInterval(id);
      };
    }
  }, [player.playing, player.update]);

  const windowStart = currentSeek - zoom / 2;
  const windowEnd = currentSeek + zoom / 2;
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
    <Layout>
      {/* @ts-ignore */}
      <ReactPlayer
        playing={player.playing}
        url={album.url}
        width="100%"
        height="200px"
        onReady={(rp) => {
          setRp(rp);
          setDuration(rp.getDuration())
        }}
        onPlay={player.play}
        onPause={player.pause}
        onProgress={onProgress}
        onSeek={player.seek}
        onEnded={player.pause}
      />
      {duration > 0 && (
        <>
          <main className="seek-window">
            <div className="seek-tracks">
              {inViewTracks.map((track) => {
                const active = track.start <= currentSeek && track.end >= currentSeek;
                const start = Math.max(windowStart, track.start);
                const end = Math.min(windowEnd, track.end);
                const width = clamp(0, 100, ((end - start) / zoom) * 100);
                const offset =
                  windowStart < 0 ? (-windowStart / zoom) * 100 : 0;

                return (
                  <div
                    key={track.title}
                    style={{ width: `${width}%`, marginLeft: `${offset}%` }}
                    className={["sample track", active && "active"]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="description">{track.title}</div>
                  </div>
                );
              })}
            </div>
            <div className="seek-samples">
              {inViewSamples.map((sample) => {
                const active = sample.start <= currentSeek && sample.end >= currentSeek;
                const left =
                  sample.start <= windowStart
                    ? 0
                    : clamp(
                        0,
                        100,
                        ((sample.start - windowStart) / zoom) * 100
                      );

                const right =
                  sample.end >= windowEnd
                    ? 0
                    : clamp(0, 100, ((windowEnd - sample.end) / zoom) * 100);

                const title = `${sample.artist}, ${sample.title}`;
                return (
                  <div
                    key={sample.idx}
                    style={{ marginLeft: `${left}%`, marginRight: `${right}%` }}
                    className={["sample", active && "active"]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="description">
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={`https://www.google.com/search?btnI&q=${encodeURIComponent(
                          `site:youtube.com ${title}`
                        )}`}
                        onClick={() => player.pause()}
                      >
                        {title}
                      </a>
                      <br />
                      <small>
                        {secondsToTime(sample.start)}&mdash;
                        {secondsToTime(sample.end)}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
          <footer>
            <select defaultValue={selected} onChange={e => {
              player.pause();
              rp?.seekTo(0);
              setSelected(e.target.value)
            }}>
              {Object.entries(albums).map(([k, v]) => <option key={k} value={k}>{v.title}</option>)}
            </select>
            <div>
                sauce:
                <a href={album.source} target="_blank" rel="noreferrer">
                  timings
                </a>
                <a href="https://favicon.io/" target="_blank" rel="noreferrer">
                  favicon
                </a>
            </div>
          </footer>
        </>
      )}
    </Layout>
  );
}
