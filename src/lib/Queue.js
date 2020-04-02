import Bee from 'bee-queue';
import CancellationMail from '../app/jobs/CancellationMail';
import redisConfig from '../config/redis';

// Pega todos os jobs  da aplicação
const jobs = [CancellationMail];

class Quee {
  constructor() {
    this.queues = {};
    this.init();
  }

  // Armazena os jobs dentro do queues
  init() {
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        // Instnacia que conecta com redis
        bee: new Bee(key, {
          redis: redisConfig,
        }),
        // Processa a fila
        handle,
      };
    });
  }

  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  // Processa os jobs em tempo real
  processQueue() {
    jobs.forEach((job) => {
      const { bee, handle } = this.queues[job.key];
      bee.process(handle);
    });
  }
}

export default new Quee();
