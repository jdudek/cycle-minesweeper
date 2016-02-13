import type { Observable } from 'rx';

declare module '@cycle/core' {
  declare function run(main: Function, sinks: Object): any;
}

type HTMLEvent = {
  button: number,
  target: HTMLElement,
};

declare module '@cycle/dom' {
  declare type DOM = {
    select: (selector: string) => DOM,
    events: (selector: string) => Observable<HTMLEvent>,
  };

  declare function makeDOMDriver(root: string): any;

  declare function div(): any;
}
