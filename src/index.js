import Cycle from '@cycle/core';
import { makeDOMDriver, div } from '@cycle/dom';
import _ from 'lodash';

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
    .map((e) => e.target.dataset);
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
  const mines = _.take(_.shuffle(allCoords(width, height)), count);
  const hasMine = (x, y) => !! _.find(mines, [x, y]);

  const squares = _.zipObject(
    allCoords(width, height).map(([x, y]) => [key(x, y), {
      x, y,
      uncover: false,
      mine: hasMine(x, y),
      count: getNeighbours(x, y)
        .map(([x, y]) => hasMine(x, y))
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
  return _.flatten(_.times(width, (i) => _.times(height, (j) => [i, j])));
}

function getNeighbours(x, y) {
  return [
    [x - 1, y - 1],
    [x - 1, y],
    [x - 1, y + 1],
    [x, y - 1],
    [x, y + 1],
    [x + 1, y - 1],
    [x + 1, y],
    [x + 1, y + 1],
  ];
}

function key(x, y) {
  return `${x}-${y}`;
}

function applyClick(state, { x, y }) {
  return {
    ...state,
    squares: {
      ...state.squares,
      [key(x, y)]: {
        ...state.squares[key(x, y)],
        uncover: true,
      },
    },
  };
}

// view

function view(state$) {
  return state$.map(({ width, height, squares }) =>
    renderGrid({
      width, height,
      children: _.map(
        _.sortBy(_.values(squares), ({ x, y }) => [x, y]),
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
