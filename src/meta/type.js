const Type = x => {
  switch (typeof x) {
    case 'string':
      return 'String';
    case 'number':
      return 'Number';
    case 'boolean':
      return 'Boolean';
    case 'symbol':
      return 'Symbol';
    case 'undefined':
      return 'Undefined';
    case 'object':
      return x === null
           ? 'Null'
           : 'Object';
    case 'function':
      return 'Object';
  }
};

export default Type;