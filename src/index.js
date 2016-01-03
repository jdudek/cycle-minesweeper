import Cycle from '@cycle/core';
import { makeDOMDriver, div } from '@cycle/dom';
import { Observable } from 'rx';
import _ from 'lodash';

Cycle.run(main, { DOM: makeDOMDriver('#app') });

function main({ DOM }) {
  return {
    DOM: view(model(intent(DOM)))
  };
}

function intent({ DOM }) {
  return Observable.empty();
}

// model

function model(action$) {
  const width = 8, height = 8, count = 10; // beginner
  // const width = 16, height = 16, count = 40; // intermediate
  // const width = 30, height = 16, count = 99; // expert

  return action$.
    startWith(getInitialState(width, height)).
    do(x => console.log(x));
}

function getInitialState(width, height) {
  return {
    width,
    height,
    squares: _.zipObject(
      allCoords(width, height).map(([x, y]) => [`${x}-${y}`, {
        x, y,
      }])
    ),
  };
}

function allCoords(width, height) {
  return _.flatten(_.times(width, (i) => _.times(height, (j) => [i, j])));
}

// view

function view(state$) {
  return state$.map(({ width, height, squares }) =>
    renderGrid({ width, height, children: _.map(squares, renderSquare) })
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

function renderSquare(square) {
  return div('.grid__cell', {
    style: {
      position: 'absolute',
      width: SQUARE_WIDTH + 'px',
      height: SQUARE_HEIGHT + 'px',
      left: square.x * SQUARE_WIDTH + 'px',
      top: square.y * SQUARE_HEIGHT + 'px',
      background: '#eee',
      border: 'solid 1px #ccc',
    },
  });
}
