import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import authConfig from '../../config/auth';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Verifica se o usuário passou o token
  if (!authHeader) {
    return res.status(401).json({ error: 'Token not provided' });
  }
  // Pega o token
  const [, token] = authHeader.split(' ');

  try {
    // Transforma uma função callback em um async await
    const decoded = await promisify(jwt.verify)(token, authConfig.secret);

    // Passa o Id do usuário para o req sendo possivel usar em toda aplicação
    req.userId = decoded.id;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid' });
  }
};
