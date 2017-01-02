export default function Observer(destination) {
  this.destination = destination
}

Observer.prototype = {
  constructor: Observer,

  next(value) {
    if (this.destination.next && !this.isUnsubscribed) {
      this.destination.next && this.destination.next(value)
    }
  },

  error(e) {
    if (!this.isUnsubscribed) {
      if (this.destination.error) {
        this.destination.error(e)
      }
      this.unsubscribe()
    }
  },

  complete() {
    if (!this.isUnsubscribed) {
      if (this.destination.complete) {
        this.destination.complete()
      }
      this.unsubscribe()
    }
  },

  unsubscribe() {
    this.isUnsubscribed = true
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  }
}