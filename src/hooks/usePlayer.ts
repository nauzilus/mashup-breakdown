import { Reducer, useCallback, useMemo, useReducer } from "react";

interface PlayerState {
  playing: boolean;
  duration: number;
  seek: number;
  asAt: number;
}

interface Action<T extends string> {
  type: T;
}
interface ActionWithPayload<T extends string, TPayload> extends Action<T> {
  payload: TPayload;
}

type PlayAction = Action<"play">;
type PauseAction = Action<"pause">;
type ToggleAction = Action<"toggle">;
type UpdateAction = Action<"update">;
type PlayerAction = PlayAction | PauseAction | ToggleAction | UpdateAction;

function getSeek(state: PlayerState): number {
  return state.playing
    ? state.seek + (Date.now() - state.asAt) / 1000
    : state.seek;
}

function reducer(state: PlayerState, action: PlayerAction): PlayerState {
  const switchAction = (() => {
    if (action.type === "toggle") {
      return state.playing ? "pause" : "play";
    }
    return action.type;
  })();

  switch (switchAction) {
    case "play": {
      return {
        ...state,
        playing: true,
        asAt: Date.now(),
      };
    }
    case "pause": {
      return {
        ...state,
        playing: false,
        seek: getSeek(state),
        asAt: Date.now(),
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
            asAt: Date.now(),
          }),
        };
      }
      return state;
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
      asAt: Date.now(),
    }
  );

  const play = useCallback(() => dispatch({ type: "play" }), []);
  const pause = useCallback(() => dispatch({ type: "pause" }), []);
  const toggle = useCallback(() => dispatch({ type: "toggle" }), []);
  const update = useCallback(() => dispatch({ type: "update" }), []);
  const currentSeek = useCallback(() => getSeek(state), [state]);

  return useMemo(
    () => ({
      play,
      pause,
      toggle,
      update,
      currentSeek,
      playing: state.playing,
    }),
    [play, pause, toggle, update, currentSeek, state]
  );
}
