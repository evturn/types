const assert = condition => {
  if (condition !== true && condition !== false) {
    throw new TypeError('Assertions should be only of booleans.');
  }
  if (!condition) {
    throw new Error('An assertion needs a condition argument.');
  }
};

export default assert;