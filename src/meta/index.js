const assert = condition => {
  if (condition !== true && condition !== false) {
    throw new TypeError('Assertions should be only of booleans.');
  }
  if (!condition) {
    throw new Error('An assertion needs a condition argument.');
  }
};

const InternalSlot = () => {
  const Slots = new WeakMap();

  return {
    make: (obj, names) => {
      assert(!Slots.has(obj));

      const slots = Object.create(null);
      names.forEach(name => slots[name] = undefined)
      Slots.set(obj, slots);
    },

    get: (obj, name) => {
      assert(Slots.has(obj));
      assert(name in Slots.get(obj));
      return Slots.get(obj)[name];
    },

    set: (obj, name, value) => {
      assert(Slots.has(obj));
      assert(name in Slots.get(obj));
      Slots.get(obj)[name] = value;
    },

    has: (obj, name) => {
      return Slots.has(obj) && name in Slots.get(obj);
    },
  };
};

export default InternalSlot;