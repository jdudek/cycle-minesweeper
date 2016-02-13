declare module 'rx' {
  declare class Observable<T> {
    filter(f: (item: T) => boolean): Observable<T>;

    map<R>(f: (item: T) => R): Observable<R>;

    scan<R>(f: (prev: R, next: T) => R): Observable<R>;

    startWith<R>(init: R): Observable<T>;

    static merge(...args: Array<Observable>): Observable;
  }
}
