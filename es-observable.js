const polyfillSymbol = name => {
  if (!Symbol[name])
    Object.defineProperty(Symbol, name, {value: Symbol(name)})
}

polyfillSymbol('observable')

const nonEnum = obj => {
  Object.getOwnPropertyNames(obj)
    .forEach(key => Object.defineProperty(obj, key, {enumerable: false}))
  return obj
}

const getMethod = (obj, key) => {
  const value = obj[key]
  return value == null               ? undefined
       : typeof value !== 'function' ? throw new TypeError(`${value} is not a function`)
       :                               value
}

const getCleanupValue = cleanup => {
  /* The return value must be undefined, null, a subscription object, or a function */
  if (cleanup != null) {
    if (typeof cleanup.unsubscribe === 'function')
      cleanup = cleanupFromSubscription(cleanup)
    else if (typeof cleanup !== 'function')
      throw new TypeError(cleanup + ' is not a function')

    return cleanup
  }
}

const cleanupSubscription = subscription => {
  const cleanup = subscription._cleanup

  if (!cleanup) { return }
  /* Remove the reference so it is only called once */
  subscription._cleanup = undefined;
  try {
    cleanup()
  } catch (e) {
    // HostReportErrors(e)
  }
}

const subscriptionClosed = subscription => {
  return subscription._observer === undefined
}

const closeSubscription = subscription => {
  if (subscriptionClosed(subscription)) { return }
  subscription._observer = undefined
  cleanupSubscription(subscription)
}

const cleanupFromSubscription = subscription => {
  return _ => subscription.unsubscribe()
}

function Subscription(observer, subscriber) {
  /* The observer must be an object */
  this._cleanup = undefined
  this._observer = observer

  /* If the observer has a start method, call it with the subscription object */
  try {
    const start = getMethod(observer, 'start')
    if (start) {
      start.call(observer, this)
    }
  } catch(e) {
    // HostReportErrors(e)
  }

  /* If the observer has unsubscribed from the start method, exit */
  if (subscriptionClosed(this)) { return }
  observer = new SubscriptionObserver(this)

  try {
    /* Call the subscriber function */
    const cleanup = subscriber.call(undefined, observer)
    this._cleanup = getCleanupValue(cleanup)
  } catch (e) {
    /* If an error occurs during startup send the error to the observer */
    observer.error(e)
    return
  }

  /* If the stream is already finished, perform cleanup */
  if (subscriptionClosed(this)) {
    cleanupSubscription(this)
  }
}