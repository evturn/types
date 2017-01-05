const delayed = typeof setImmediate !== 'undefined' ? setImmediate
              : typeof process !== 'undefined'      ? process.nextTick
              : /* otherwise */                       setTimeout

export default function Task(computation, cleanup) {
  this.fork = computation
  this.cleanup = cleanup || (_ => _)
}


Task.prototype = {
  constructor: Task,

  of(b) {
    return new Task((_, resolve) => resolve(b))
  },

  rejected(a) {
    return new Task((reject) => reject(a))
  },

  map(f) {
    return new Task((reject, resolve) => {
      return this.fork(a => reject(a), b => resolve(f(b)))
    }, this.cleanup)
  },

  chain(f) {
    return new Task((reject, resolve) => {
      return this.fork(a => reject(a), b => f(b).fork(reject, resolve))
    }, this.cleanup)
  },

  orElse(f) {
    return new Task((reject, resolve) => {
      return this.fork(a => f(a).fork(reject, resolve), b => resolve(b))
    }, this.cleanup)
  },

  fold(f, g) {
    return new Task((_, resolve) => {
      return this.fork(a => resolve(f(a)), b => resolve(g(b)))
    }, this.cleanup)
  },

  bimap(f, g) {
    return new Task((reject, resolve) => {
      return this.fork(a => reject(f(a)), b => resolve(g(b)))
    }, this.cleanup)
  },

  ap(taskB) {
    const cleanupBoth = ([stateA, stateB]) => {
      this.cleanup(stateA)
      taskB.cleanup(stateB)
    }

    return new Task((reject, resolve) => {
      let combinedState
      const status = {
        func: false,
        funcLoaded: false,
        val: false,
        valLoaded: false,
        rejected: false,
      }

      const guardReject = x => {
        if (!status.rejected) {
          status.rejected = true
          return reject(x)
        }
      }

      const guardResolve = setter => {
        return x => {
          if (status.rejected) {
            return
          }

          setter(x)
          if (status.funcLoaded && status.valLoaded) {
            delayed(_ => cleanupBoth(combinedState))
            return resolve(status.func(status.val))
          } else {
            return x
          }
        }
      }

      const stateA = this.fork(guardReject, guardResolve(x => {
        Object.assign(status, {funcLoaded: true, func: x})
      }))
      const stateB = taskB.fork(guardReject, guardResolve(x => {
        Object.assign(status, {valLoaded: true, val: x})
      }))

      return combinedState = [stateA, stateB]
    }, cleanupBoth)
  },

  concat(taskB) {
    const cleanupBoth = ([stateA, stateB]) => {
      this.cleanup(stateA)
      taskB.cleanup(stateB)
    }

    return new Task((reject, resolve) => {
      let combinedState
      let done = false

      const guard = f => {
        return x => {
          if (!done) {
            done = true
            delayed(_ => cleanupBoth(combinedState))
            return f(x)
          }
        }
      }

      return combinedState = [
        this.fork(guard(reject), guard(resolve)),
        taskB.fork(guard(reject), guard(resolve))
      ]
    }, cleanupBoth)
  },

  swap() {
    return new Task((reject, resolve) => {
      return this.fork(a => resolve(a), b => return reject(b))
    }, this.cleanup)
  },

  rejectedMap(f) {
    return new Task((reject, resolve) => {
      return this.fork(a => reject(f(a)), b => resolve(b))
    }, this.cleanup)
  },

  cata(pattern) {
    return this.fold(pattern.Rejected, pattern.Resolved)
  },

  empty() {
    return new Task(_ => _)
  },

  toString() {
    return 'Task'
  }
}

Task.of = Task.prototype.of
Task.rejected = Task.prototype.rejected
Task.empty = Task.prototype.empty