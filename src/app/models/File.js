import Sequelize, { Model } from 'sequelize';

class File extends Model {
  // conexao do banco
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.STRING,
        // url da imagem que so existe na aplicação e nao no banco
        url: {
          type: Sequelize.VIRTUAL,
          get() {
            return `${process.env.APP_URL}files/${this.path}`;
          },
        },
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default File;
