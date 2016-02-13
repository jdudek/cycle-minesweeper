declare module '@cycle/core' {
  declare function run(main: Function, sinks: Object): any;
}

declare module '@cycle/dom' {
  declare function makeDOMDriver(root: string): any;

  declare function div(): any;
}
