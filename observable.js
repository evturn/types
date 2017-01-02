import Observer from './observer'

export default function Observable(_subscribe) {
  this._subscribe = _subscribe
}

Observable.prototype = {
  constructor: Observable,

  subscribe(subscriber) {
    const observer = new Observer(subscriber)
    observer._unsubscribe = this._subscribe(observer)
    return _ => observer.unsubscribe()
  }
}