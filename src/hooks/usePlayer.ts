import { Reducer, useCallback, useEffect, useMemo, useReducer } from "react";
import { clamp } from "../util/clamp";

interface PlayerState {
  playing: boolean;
  duration: number;
  seek: number;
  ts: number;
}

interface Action<T extends string> {
  type: T;
  ts: number;
}
interface ActionWithPayload<T extends string, TPayload> extends Action<T> {
  payload: TPayload;
}

type PlayAction = Action<"play">;
type PauseAction = Action<"pause">;
type ToggleAction = Action<"toggle">;
type UpdateAction = Action<"update">;
type SeekAction = ActionWithPayload<"seek", number>;
type InitAction = ActionWithPayload<"init", number>;
type PlayerAction =
  | PlayAction
  | PauseAction
  | ToggleAction
  | UpdateAction
  | InitAction
  | SeekAction;

function getSeek(state: PlayerState): number {
  return clamp(
    0,
    state.duration,
    state.playing ? state.seek + (Date.now() - state.ts) / 1000 : state.seek
  );
}

function reducer(state: PlayerState, action: PlayerAction): PlayerState {
  const switchAction: PlayerAction = (() => {
    if (action.type === "toggle") {
      return state.playing
        ? ({ type: "pause" } as PauseAction)
        : ({ type: "play" } as PlayAction);
    }
    return action;
  })();

  switch (switchAction.type) {
    case "play": {
      return {
        ...state,
        playing: true,
        ts: action.ts,
      };
    }
    case "pause": {
      return {
        ...state,
        playing: false,
        seek: getSeek(state),
        ts: action.ts,
      };
    }
    case "update": {
      if (state.playing) {
        const playing = getSeek(state) < state.duration;
        return {
          ...state,
          playing,
          ...(!playing && {
            seek: getSeek(state),
            ts: action.ts,
          }),
        };
      }
      return state;
    }
    case "init": {
      return {
        duration: (action as InitAction).payload,
        seek: 0,
        playing: false,
        ts: action.ts,
      };
    }
    case "seek": {
      return {
        ...state,
        seek: (action as SeekAction).payload,
        ts: action.ts,
      };
    }
    default:
      return state;
  }
}

export interface UsePlayerApi {
  playing: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  update: () => void;
  seek: (seconds: number) => void;
  currentSeek: () => number;
}

export function usePlayer(
  duration: number,
  initialSeek = 0,
  playing = false
): UsePlayerApi {
  const [state, dispatch] = useReducer<Reducer<PlayerState, PlayerAction>>(
    reducer,
    {
      playing,
      duration,
      seek: initialSeek,
      ts: Date.now(),
    }
  );

  useEffect(() => {
    dispatch({ type: "init", ts: Date.now(), payload: duration });
  }, [duration]);

  const play = useCallback(
    () => dispatch({ type: "play", ts: Date.now() }),
    []
  );
  const pause = useCallback(
    () => dispatch({ type: "pause", ts: Date.now() }),
    []
  );
  const toggle = useCallback(
    () => dispatch({ type: "toggle", ts: Date.now() }),
    []
  );
  const update = useCallback(
    () => dispatch({ type: "update", ts: Date.now() }),
    []
  );
  const seek = useCallback(
    (seconds: number) =>
      dispatch({ type: "seek", ts: Date.now(), payload: seconds }),
    []
  );
  const currentSeek = useCallback(() => getSeek(state), [state]);

  return useMemo(
    () => ({
      play,
      pause,
      toggle,
      update,
      seek,
      currentSeek,
      playing: state.playing,
    }),
    [play, pause, toggle, update, seek, currentSeek, state]
  );
}
