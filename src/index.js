import Cycle from '@cycle/core';
import { makeDOMDriver, div } from '@cycle/dom';
import { Observable } from 'rx';

Cycle.run(main, { DOM: makeDOMDriver('#app') });

function main({ DOM }) {
  return {
    DOM: view(model(intent(DOM)))
  };
}

function intent({ DOM }) {
  return Observable.empty();
}

function model(action$) {
  return action$.map((action) => {}).startWith(null);
}

function view(state$) {
  return state$.map((state) => div(['Hello!']));
}
