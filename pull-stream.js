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