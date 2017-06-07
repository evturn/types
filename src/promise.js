import InternalSlot, { Callable, EnqueueJob, Type } from './meta';
import assert from './meta/assert';

/* Internal slots */
const $$ = {
  state: '[[PromiseState]]',
  result: '[[PromiseResult]]',
  fulfilled: '[[PromiseFulfillReactions]]',
  rejected: '[[PromiseRejectReactions]]',
  resolved: '[[AlreadyResolved]]',
  reject: '[[Reject]]',
  resolve: '[[Resolve]]',
  handler: '[[Handler]]',
  capabilities: '[[Capabilities]]',
  capability: '[[Capability]]',
  value: '[[value]]',
  promise: '[[Promise]]',
  constructor: '[[PromiseConstructor]]',
};

const Slots = InternalSlot();

const createResolveFn = () => {
  const Resolve = resolution => {
    const promise = Slots.get(Resolve, $$.promise);
    const resolved = Slots.get(Resolve, $$.resolved);

    if (resolved[$$.value] === true) {
      return undefined;
    }
    resolved[$$.value] = true;
    if (Object.is(resolution, promise) === true) {
      return RejectPromise(promise, new TypeError('Tried to resolve a promise with itself.'));
    }
    if (Type(resolution) !== 'Object') {
      return FulfillPromise(promise, resolution);
    }

    let then;
    try {
      then = resolution.then;
    } catch (e) {
      return RejectPromise(promise, e);
    }
    if (Callable(then) === false) {
      return FulfillPromise(promise, resolution);
    }
    EnqueueJob('PromiseTasks', ResolvePromiseViaThenableTask, [promise, resolution, then]);
  };

  Slots.make(Resolve, [$$.promise, $$.resolved]);

  return Resolve;
}

const createRejectFn = () => {
  const Reject = reason => {
    const promise = Slots.get(Reject, $$.promise);
    const resolved = Slots.get(Reject, $$.resolved);
    if (resolved[$$.value] === true) {
      return undefined;
    }
    resolved[$$.value] = true;
    RejectPromise(promise, reason);
  };

  Slots.make(Reject, [$$.promise, $$.resolved]);

  return Reject;
};

const createResolvers = promise => {
  const resolved = {[$$.value]: false};
  const reject = createRejectFn();
  const resolve = createResolveFn();
  Slots.set(reject, $$.promise, promise);
  Slots.set(reject, $$.resolved, resolved);
  Slots.set(resolve, $$.promise, promise);
  Slots.set(resolve, $$.resolved, resolved);
  return {[$$.resolve]: resolve, [$$.reject]: reject};
};

const FulfillPromise = (promise, value) => {
  assert(Slots.get(promise, $$.state) === 'pending');
  const reactions = Slots.get(promise, $$.fulfilled);
  Slots.set(promise, $$.result, value);
  Slots.set(promise, $$.fulfilled, undefined);
  Slots.set(promise, $$.rejected, undefined);
  Slots.set(promise, $$.state, 'fulfilled');
  return TriggerPromiseReactions(reactions, value);
};

const RejectPromise = (promise, reason) => {
  assert(Slots.get(promise, $$.state) === 'pending');
  const reactions = Slots.get(promise, $$.rejected);
  Slots.set(promise, $$.result, reason);
  Slots.set(promise, $$.fulfilled, undefined);
  Slots.set(promise, $$.rejected, undefined);
  Slots.set(promise, $$.state, 'rejected');
  return TriggerPromiseReactions(reactions, reason);
};

const TriggerPromiseReactions = (reactions, arg) => {
  reactions.forEach(reaction => EnqueueJob('PromiseTasks', PromiseReactionTask, [reaction, arg]));
};

const PromiseReactionTask = (reaction, arg) => {
  assert($$.capabilities in reaction && $$.handler in reaction);
  let handlerResult;
  const promiseCapability = reaction[$$.capabilities];
  const handler = reaction[$$.handler];

  try {
    if (handler === 'Identity') {
      handlerResult = arg;
    } else if (handler === 'Thrower') {
      throw arg;
    } else {
      handlerResult = handler.call(undefined, arg);
    }
  } catch (e) {
    return promiseCapability[$$.reject].call(undefined, e);
  }

  return promiseCapability[$$.resolve].call(undefined, handlerResult);
};

const ResolvePromiseViaThenableTask = (promiseToResolve, thenable, then) => {
  const resolvers = createResolvers(promiseToResolve);
  try {
    return then.call(thenable, resolvers[$$.resolve], resolvers[$$.reject]);
  } catch (e) {
    return resolvers[$$reject].call(undefined, e);
  }
}

const CreatePromiseCapabilityRecord = promise => {
  const capability = {
    [$$.promise]: promise,
    [$$.resolve]: undefined,
    [$$.reject]: undefined ,
  };
  const executor = GetCapabilitiesExecutorFunction();
  Slots.set(executor, $$.capability, capability);
  const constructorResult = constructor.call(promise, executor);
  if (Callable(capability[$$.resolve]) === false) {
    throw new TypeError('This constructor does not pass a callable resolve argument.');
  }
  if (Callable(capability[$$.reject]) === false) {
    throw new TypeError('This constructor does not pass a callable reject argument.');
  }
  if (Type(constructorResult) === 'Object' && Object.is(promise, constructorResult) === false) {
    throw new TypeError('Inconsistent result from constructing the promise.');
  }
  return capability;
};

const GetCapabilitiesExecutorFunction = () => {
  const CapabilitiesExecutor = (resolve, reject) => {
    assert(Slots.has(CapabilitiesExecutor, $$.capability));
    const capability = Slots.get(CapabilitiesExecutor, $$.capability);
    if (capability[$$.resolve] !== undefined) {
      throw new TypeError("Re-entrant call to get capabilities executor function");
    }
    if (capability[$$.reject] !== undefined) {
      throw new TypeError("Re-entrant call to get capabilities executor function");
    }
    capability[$$.resolve] = resolve;
    capability[$$.reject] = reject;
    return undefined;
  };

  Slots.make(CapabilitiesExecutor, [$$.capability]);

  return CapabilitiesExecutor;
};

class Promise {
  constructor(executor) {
    const promise = this;
    assert(Slots.get(promise, $$.state) === undefined);
    assert(Callable(executor) === true);

    Slots.set(promise, $$.state, 'pending');
    Slots.set(promise, $$.fulfilled, []);
    Slots.set(promise, $$.rejected, []);

    const resolvers = createResolvers(promise);
    try {
      executor.call(undefined, resolvers[$$.resolve], resolvers[$$.reject]);
    } catch (e) {
      resolvers[$$.reject].call(undefined, e);
    }
    return promise;
  }

  then(onFulfilled, onRejected) {
    if (Callable(onFulfilled) === false) {
      onFulfilled = 'Identity';
    }

    if (Callable(onRejected) === false) {
      onRejected = 'Thrower';
    }

    const capability = CreatePromiseCapabilityRecord(Object.create(Promise.prototype));

    const fulfillReaction = {
      [$$.capabilities]: capability,
      [$$.handler]: onFulfilled,
    };
    const rejectReaction = {
      [$$.capabilities]: capability,
      [$$.handler]: onRejected
    };

    if (Slots.get(this, $$.state) === 'pending') {
      Slots.get(this, $$.fulfilled).push(fulfillReaction);
      Slots.get(this, $$.rejected).push(rejectReaction);
    } else if (Slots.get(this, $$.state) === 'fulfilled') {
      const value = Slots.get(this, $$.result);
      EnqueueJob('PromiseTasks', PromiseReactionTask, [fulfillReaction, value]);
    } else if (Slots.get(this, $$.state) === 'rejected') {
      const reason = Slots.get(this, $$.result);
      EnqueueJob('PromiseTasks', PromiseReactionTask, [rejectReaction, reason]);
    }

    return capability[$$.promise];
  }
}

export default Promise;