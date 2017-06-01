class Observer {
  constructor(destination) {
    this.destination = destination
  }

  next(value) {
    if (this.destination.next && !this.isUnsubscribed) {
      this.destination.next && this.destination.next(value)
    }
  }

  error(e) {
    if (!this.isUnsubscribed) {
      if (this.destination.error) {
        this.destination.error(e)
      }
      this.unsubscribe()
    }
  }

  complete() {
    if (!this.isUnsubscribed) {
      if (this.destination.complete) {
        this.destination.complete()
      }
      this.unsubscribe()
    }
  }

  unsubscribe() {
    this.isUnsubscribed = true
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  }
}

class Observable {
  constructor(_subscribe) {
    this._subscribe = _subscribe
  }

  subscribe(subscriber) {
    const observer = new Observer(subscriber)
    observer._unsubscribe = this._subscribe(observer)
    return _ => observer.unsubscribe()
  }
}

export default Observable