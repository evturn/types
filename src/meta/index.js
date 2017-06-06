import assert from './assert';
export Callable from 'callable';
export EnqueueJob from './enqueue-job';
export Type from './type';

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