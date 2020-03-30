import Sequelize from 'sequelize';

import User from '../app/models/User';
import File from '../app/models/File';
import Appointment from '../app/models/Appointment';

import databaseConfig from '../config/database';

// Arrays de Models da aplicação
const models = [User, File, Appointment];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models
      // Faz a conexão com o banco
      .map((model) => model.init(this.connection))
      // Faz os relacionamentos entre tabelas/models
      .map(
        (model) => model.associate && model.associate(this.connection.models)
      );
  }
}

export default new Database();
