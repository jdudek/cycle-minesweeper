type $Observable<T> = {
  map<R>(f: (item: T) => R): $Observable<R>;

  scan<R>(f: (prev: R, next: T) => R): $Observable<R>;

  startWith<R>(init: R): $Observable<T>;
}


declare module 'rx' {
  declare type Observable<T> = $Observable<T>;
}
