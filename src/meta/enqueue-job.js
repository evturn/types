import assert from './assert';
import Type from './type';

const EnqueueJob = (queueName, job, args) => {
  assert(Type(queueName) === 'String');
  assert(typeof job === 'function');
  assert(Array.isArray(args) && args.length === job.length);
  process.nextTick(() => job(...args));
};

export default EnqueueJob;