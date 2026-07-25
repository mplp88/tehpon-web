import { Router, Request, Response } from 'express';
import { Command } from '../models/Command.js';
import { requireStreamerAdmin } from '../middlewares/auth.js';

const router = Router();

const normalizeCommandName = (name: string): string => {
  const trimmed = name.trim().toLowerCase();
  return trimmed.startsWith('!') ? trimmed : `!${trimmed}`;
};

router.get('/', async (req, res) => {
  try {
    const showAll = req.query.all === 'true';
    const filter = showAll ? {} : { isActive: true };

    const commands = await Command.find(filter).sort({
      category: 1,
      name: 1,
    });

    res.json(commands);
  } catch (error) {
    console.error((error as Error).message);
    res.status(500).json({ error: 'Error al obtener los comandos' });
  }
});

router.get('/:identifier', async (req: Request, res: Response) => {
  try {
    const identifier = req.params.identifier + '';

    let command;
    // Si parece un ObjectId de Mongo lo buscamos por _id, si no por name
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      command = await Command.findById(identifier);
    } else {
      const normalized = normalizeCommandName(identifier);
      command = await Command.findOne({ name: normalized });
    }

    if (!command) {
      return res.status(404).json({ error: 'Comando no encontrado' });
    }

    res.json(command);
  } catch (error) {
    console.error((error as Error).message);
    res.status(500).json({ error: 'Error al obtener el comando' });
  }
});

router.post('/', requireStreamerAdmin, async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      category,
      isActive,
      chatResponse,
      media,
      cooldown,
    } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({
        error: 'Campos requeridos: name, description y category',
      });
    }

    const formattedName = normalizeCommandName(name);

    // Verificar si ya existe un comando con ese nombre
    const existing = await Command.findOne({ name: formattedName });
    if (existing) {
      return res.status(400).json({
        error: `Ya existe un comando registrado con el nombre "${formattedName}"`,
      });
    }

    const newCommand = new Command({
      name: formattedName,
      description,
      category,
      isActive: isActive ?? true,
      chatResponse,
      media,
      cooldown: cooldown ?? 0,
    });

    await newCommand.save();
    res.status(201).json(newCommand);
  } catch (error) {
    console.error((error as Error).message);
    res.status(500).json({ error: 'Error al crear el comando' });
  }
});

router.put(
  '/:id',
  requireStreamerAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        category,
        isActive,
        chatResponse,
        media,
        cooldown,
      } = req.body;

      const updateData: any = {};

      if (name) updateData.name = normalizeCommandName(name);
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (chatResponse !== undefined) updateData.chatResponse = chatResponse;
      if (media !== undefined) updateData.media = media;
      if (cooldown !== undefined) updateData.cooldown = cooldown;

      const updatedCommand = await Command.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedCommand) {
        return res.status(404).json({ error: 'Comando no encontrado' });
      }

      res.json(updatedCommand);
    } catch (error) {
      console.error((error as Error).message);
      res.status(500).json({ error: 'Error al actualizar el comando' });
    }
  },
);

router.delete(
  '/:id',
  requireStreamerAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deletedCommand = await Command.findByIdAndDelete(id);

      if (!deletedCommand) {
        return res.status(404).json({ error: 'Comando no encontrado' });
      }

      res.json({ message: 'Comando eliminado correctamente', id });
    } catch (error) {
      console.error((error as Error).message);
      res.status(500).json({ error: 'Error al eliminar el comando' });
    }
  },
);

export default router;
