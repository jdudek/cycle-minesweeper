/* @flow */

import Cycle from '@cycle/core';
import { makeDOMDriver, div } from '@cycle/dom';
import type { DOM } from '@cycle/dom';
import { Observable } from 'rx';
import {
  extend, find, flatten, fromPairs, map, shuffle, sortBy, take, times, values
} from 'lodash';

Cycle.run(main, { DOM: makeDOMDriver('#app') });

function main({ DOM }) {
  return {
    DOM: view(model(intent(DOM))),
  };
}

// intent

type Coords = {
  x: number,
  y: number,
};

type Action = ({ uncover: Coords }) | ({ mark: Coords });

function intent(DOM: DOM): Observable<Action> {
  function eventToCoords(e) {
    let { x, y } = e.target.dataset;
    return {
      x: parseInt(x, 10),
      y: parseInt(y, 10),
    };
  }

  const click$ = DOM.select('.square').events('mousedown')
  click$.do((e) => e.preventDefault());
  const lftClick$ = click$.filter((e) => e.button === 0);
  const rgtClick$ = click$.filter((e) => e.button === 2);

  const uncover$ = lftClick$.map(eventToCoords).map((v) => ({ uncover: v }));
  const mark$    = rgtClick$.map(eventToCoords).map((v) => ({ mark: v }));

  return Observable.merge(uncover$, mark$);
}

// model

type Square = {
  x: number,
  y: number,
  uncover: boolean,
  mark: boolean,
  mine: boolean,
  count: number,
};

type State = {
  width: number,
  height: number,
  squares: { [key: string]: Square },
};

function model(action$: Observable<Action>): Observable<State> {
  const width = 8, height = 8, count = 10; // beginner
  // const width = 16, height = 16, count = 40; // intermediate
  // const width = 30, height = 16, count = 99; // expert

  const initialState = getInitialState(width, height, count);

  return action$
    .startWith(initialState)
    .scan((state, action) => applyAction(state, action));
}

function getInitialState(width: number, height: number, count: number): State {
  const mines = take(shuffle(allCoords(width, height)), count);
  const hasMine = ({ x, y }) => !! find(mines, { x, y });

  const squares = fromPairs(
    allCoords(width, height).map(({ x, y }) => [key(x, y), {
      x, y,
      uncover: false,
      mark: false,
      mine: hasMine({ x, y }),
      count: hasMine({ x, y }) ? undefined : getNeighbourCoords({ x, y })
        .map(hasMine)
        .reduce((sum, i) => i ? sum + 1 : sum, 0),
    }])
  );

  return {
    width,
    height,
    squares,
  };
}

function allCoords(width, height) {
  return flatten(times(width, (i) => times(height, (j) => [i, j])))
    .map(([x, y]) => ({ x, y }));
}

function getNeighbourCoords({ x, y }) {
  return [
    { x: x - 1, y: y - 1 },
    { x: x - 1, y: y },
    { x: x - 1, y: y + 1 },
    { x: x,     y: y - 1 },
    { x: x,     y: y + 1 },
    { x: x + 1, y: y - 1 },
    { x: x + 1, y: y },
    { x: x + 1, y: y + 1 },
  ];
}

function getNeighbours(squares, { x, y }) {
  return getNeighbourCoords({ x, y })
    .map(({ x, y }) => squares[key(x, y)])
    .filter((square) => square);
}

function key(x, y): string {
  return `${x}-${y}`;
}

function applyAction(state: State, action: Action): State {
  if (action.uncover) {
    return applyUncover(state, action.uncover);
  } else if (action.mark) {
    return applyMark(state, action.mark);
  } else {
    return state;
  }
}

function applyUncover(state, { x, y }) {
  if (isGameOver(state)) return state;

  const square = state.squares[key(x, y)];
  if (square.mark) return state;

  const uncovered = fromPairs(getPositionsToUncover(state.squares, [{ x, y }])
    .map(({ x, y }) => state.squares[key(x, y)])
    .map((square) => ({ ...square, uncover: true }))
    .map((square) => [key(square.x, square.y), square]));

  return {
    ...state,
    squares: extend({}, state.squares, uncovered),
  };
}

function applyMark(state, { x, y }) {
  if (isGameOver(state)) return state;

  const square = state.squares[key(x, y)];
  if (square.uncover) return state;

  return {
    ...state,
    squares: extend(
      {},
      state.squares,
      { [key(square.x, square.y)]: { ...square, mark: !square.mark } }
    ),
  };
}

function isGameOver(state): boolean {
  return values(state.squares).some((square) => square.mine && square.uncover);
}

function isGameWon(state): boolean {
  return values(state.squares).every((square) =>
    (square.uncover && !square.mine) || (square.mark && square.mine)
  );
}

function countRemainingMarks(state): number {
  const mines = values(state.squares).filter((s) => s.mine).length;
  const marks = values(state.squares).filter((s) => s.mark).length;
  return mines - marks;
}

function getPositionsToUncover(squares, positions): Array<Coords> {
  let visited = [];
  while (positions.length > 0) {
    let position = positions.shift();
    let square = squares[key(position.x, position.y)];
    if (square.mark) continue;
    if (find(visited, { x: position.x, y: position.y })) continue;
    if (square.count === 0) {
      let neighbours = getNeighbours(squares, position);
      positions = positions.concat(neighbours);
    }
    visited.push(position);
  }
  return visited;
}

// view

function view(state$) {
  return state$.map((state) =>
    div([
      'Minesweeper',
      ` – ${countRemainingMarks(state)}`,
      isGameOver(state) ? ' — Game over' : '',
      isGameWon(state) ? ' — You won!' : '',

      renderGrid({
        width: state.width,
        height: state.height,
        children: map(
          sortBy(values(state.squares), ({ x, y }) => [x, y]),
          renderSquare
        ),
      }),
    ])
  );
}

function renderGrid({ width, height, children }) {
  return div('.grid', {
    style: {
      position: 'relative',
      width: width * SQUARE_WIDTH + 'px',
      height: height * SQUARE_HEIGHT + 'px',
      background: '#eee',
    },
  }, children);
}

const SQUARE_WIDTH = 32;
const SQUARE_HEIGHT = 32;

function renderSquare({ x, y, mine, count, uncover, mark }) {
  const icon = uncover
    ? (mine ? '✹' : (count > 0 ? count : ''))
    : (mark ? '√' : '');

  return div('.square', {
    key: key(x, y),
    dataset: {
      x, y,
    },
    style: {
      position: 'absolute',
      width: SQUARE_WIDTH + 'px',
      height: SQUARE_HEIGHT + 'px',
      left: x * SQUARE_WIDTH + 'px',
      top: y * SQUARE_HEIGHT + 'px',
      background: uncover ? '#fff' : '#eee',
      border: 'solid 1px #ccc',
      textAlign: 'center',
      lineHeight: SQUARE_HEIGHT + 'px',
    },
  }, icon);
}
