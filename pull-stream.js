function values(xs, acc=0) {
  return (abort, fn) => {
    if (abort) {
      return fn(abort)
    }
    const terminate = acc >= xs.length
                    ? true
                    : null
    return fn(terminate, xs[acc++])
  }
}

function log() {
  return read => {
    read(null, function next(end, data) {
      if (end == true) {
        return
      } else if (end) {
        throw end
      }
      console.log(data)
      read(null, next)
    })
  }
}

function map(transformFn) {
  return read =>
    (abort, fn) =>
      read(abort, (end, data) =>
        end
          ? fn(end)
          : fn(null, transformFn(data)))
}

function pull(...args) {
  const [stream] = args
  if (stream.length === 1) {
    return read => pull(read, ...args)
  }
  return args.map(fn => fn(stream))
}