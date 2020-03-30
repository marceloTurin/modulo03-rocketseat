import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format } from 'date-fns';
import { Op } from 'sequelize';

import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';

import Notification from '../schemas/Notification';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      // Paginação de agendamentos
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'date'],
      // Referencia os dados do provedor do agendamento
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          // Referencia os dados do avatar do provedor
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validations fails' });
    }

    const { provider_id, date } = req.body;

    // Verifica se o provider_id é um provider

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }

    // Transforma a hora em 00 minutos
    const hourStart = startOfHour(parseISO(date));

    // Checa se a data passada é uma data antiga
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    // Veririca se existe um agendamento com a hora passada
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not availible' });
    }

    /* const checkProviderIgualUsuario = await Appointment.findOne({
      where: {
        provider_id: {
          [Op.eq]: req.userId,
        },
      },
    });

    if (checkProviderIgualUsuario) {
      return res.status(400).json({ error: 'Provider is not equal user' });
    } */

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    // Notificar prestador de serviço

    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', ás' H:mm'h'",
      {
        locale: pt,
      }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
