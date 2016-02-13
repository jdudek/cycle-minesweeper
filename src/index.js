/* @flow */

import Cycle from '@cycle/core';
import { makeDOMDriver, div } from '@cycle/dom';
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

function intent(DOM) {
  return DOM.select('.square')
    .events('click')
    .map((e) => e.target.dataset)
    .map(({ x, y }) => ({
      x: parseInt(x, 10),
      y: parseInt(y, 10),
    }));
}

// model

function model(action$) {
  const width = 8, height = 8, count = 10; // beginner
  // const width = 16, height = 16, count = 40; // intermediate
  // const width = 30, height = 16, count = 99; // expert

  const initialState = getInitialState(width, height, count);

  return action$
    .startWith(initialState)
    .scan((state, click) => applyClick(state, click))
    .do(x => console.log(x));
}

function getInitialState(width, height, count) {
  const mines = take(shuffle(allCoords(width, height)), count);
  const hasMine = ({ x, y }) => !! find(mines, { x, y });

  const squares = fromPairs(
    allCoords(width, height).map(({ x, y }) => [key(x, y), {
      x, y,
      uncover: false,
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

function key(x, y) {
  return `${x}-${y}`;
}

function applyClick(state, { x, y }) {
  const uncovered = fromPairs(getPositionsToUncover(state.squares, [{ x, y }])
    .map(({ x, y }) => state.squares[key(x, y)])
    .map((square) => ({ ...square, uncover: true }))
    .map((square) => [key(square.x, square.y), square]));

  return {
    ...state,
    squares: extend({}, state.squares, uncovered),
  };
}

function getPositionsToUncover(squares, positions) {
  let visited = [];
  while (positions.length > 0) {
    let position = positions.shift();
    let square = squares[key(position.x, position.y)];
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
  return state$.map(({ width, height, squares }) =>
    renderGrid({
      width, height,
      children: map(
        sortBy(values(squares), ({ x, y }) => [x, y]),
        renderSquare
      ),
    })
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

function renderSquare({ x, y, mine, count, uncover }) {
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
  }, uncover ? (mine ? '✹' : (count > 0 ? count : '')) : '');
}
