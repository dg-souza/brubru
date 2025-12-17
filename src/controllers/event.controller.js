import { Evento } from "../models/event.model.js";
import multer from 'multer'
import fs from 'fs'
import path from 'path'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const eventId = req.params.id || 'common'
    const dir = path.join(process.cwd(), 'uploads', 'events', eventId)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_')
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `${unique}-${safeName}`)
  }
})

export const upload = multer({ storage })

function gerarDatasAno(ano) {
  const datas = [];

  for (let mes = 0; mes < 12; mes++) {
    for (let dia = 1; dia <= new Date(ano, mes + 1, 0).getDate(); dia++) {
      const data = new Date(ano, mes, dia);
      datas.push(data);
    }
  }

  return datas.sort((a, b) => a - b); // Ordena as datas em ordem crescente
}

const mapearEventosComDatas = async (ano) => {
  try {
    // Gerar todas as datas do ano
    const datas = gerarDatasAno(ano); // Chama a função que você já tem para gerar as datas

    // Buscar todos os eventos para o ano
    const eventos = await Evento.find({
      data_evento: {
        $gte: new Date(`${ano}-01-01`),
        $lte: new Date(`${ano}-12-31`),
      },
    });

    // Criar um objeto para mapear as datas com os eventos
    const eventosMapeados = datas.map((data) => {
      // Verifica se existe um evento para a data atual
      const eventoNoDia = eventos.find(
        (evento) =>
          evento.data_evento.toISOString().slice(0, 10) ===
          data.toISOString().slice(0, 10)
      );

      // Se existir evento, adiciona o campo `evento` com id do evento
      if (eventoNoDia) {
        return {
          data: data.toLocaleDateString("pt-BR"), // Retorna a data no formato brasileiro
          evento: true,
          eventoId: eventoNoDia._id,
        };
      } else {
        return {
          data: data.toLocaleDateString("pt-BR"),
          evento: false,
        };
      }
    });

    return eventosMapeados;
  } catch (err) {
    console.error("Erro ao mapear eventos:", err);
    throw new Error("Erro ao mapear eventos com datas.");
  }
};

export const createEvent = async (req, res) => {
  try {
    const { nome, descricao, data_evento, localizacao } = req.body;

    if (!nome || !data_evento) {
      return res
        .status(400)
        .json({ message: "Nome e data do evento são obrigatórios." });
    }

    const novoEvento = new Evento({
      nome,
      descricao,
      data_evento: new Date(data_evento),
      localizacao,
    });

    await novoEvento.save();

    return res
      .status(201)
      .json({ message: "Evento criado com sucesso!", evento: novoEvento });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erro ao criar evento: ", error: err.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const eventos = await Evento.find();

    return res.status(200).json(eventos);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Erro ao buscar eventos", error: err.message });
  }
};

export const getCalendarioComEventos = async (req, res) => {
  try {
    const ano = req.params.ano || 2025; // Padrão para 2025
    const calendarioComEventos = await mapearEventosComDatas(ano);

    return res.status(200).json(calendarioComEventos);
  } catch (err) {
    return res
      .status(500)
      .json({
        message: "Erro ao buscar o calendário com eventos",
        error: err.message,
      });
  }
};

export const getEventoById = async (req, res) => {
  try {
    const { id } = req.params;
    const evento = await Evento.findById(id);

    if (!evento) {
      return res.status(404).json({ message: "Evento não encontrado." });
    }

    return res.status(200).json(evento); // Retorna o evento encontrado
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Erro ao buscar evento", error: err.message });
  }
};

export const uploadEventPhotos = async (req, res) => {
  try {
    const { id } = req.params
    const files = req.files

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Nenhuma foto enviada.' })
    }

    const evento = await Evento.findById(id)
    if (!evento) return res.status(404).json({ message: 'Evento não encontrado.' })

    const basePath = `/uploads/events/${id}`
    const filePaths = files.map(f => `${basePath}/${f.filename}`)

    evento.photos = Array.isArray(evento.photos) ? evento.photos.concat(filePaths) : filePaths
    await evento.save()

    return res.status(200).json({ message: 'Fotos enviadas com sucesso.', photos: evento.photos })
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao fazer upload das fotos.', error: err.message })
  }
}

export const listEventPhotos = async (req, res) => {
  try {
    const { id } = req.params
    const evento = await Evento.findById(id)
    if (!evento) return res.status(404).json({ message: 'Evento não encontrado.' })

    return res.status(200).json({ photos: evento.photos || [] })
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao listar fotos.', error: err.message })
  }
}

export const getEventPhoto = async (req, res) => {
  try {
    const { id, filename } = req.params
    const filePath = path.join(process.cwd(), 'uploads', 'events', id, filename)

    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Foto não encontrada.' })

    return res.sendFile(filePath)
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao recuperar foto.', error: err.message })
  }
}

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params
    const updates = { ...req.body }

    if (updates.data_evento) {
      updates.data_evento = new Date(updates.data_evento)
    }

    const evento = await Evento.findByIdAndUpdate(id, updates, { new: true })
    if (!evento) return res.status(404).json({ message: 'Evento não encontrado.' })

    return res.status(200).json({ message: 'Evento atualizado com sucesso.', evento })
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao atualizar evento.', error: err.message })
  }
}

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params
    const evento = await Evento.findById(id)
    if (!evento) return res.status(404).json({ message: 'Evento não encontrado.' })

    // Remover arquivos do disco
    if (Array.isArray(evento.photos) && evento.photos.length > 0) {
      for (const p of evento.photos) {
        try {
          const rel = p.startsWith('/') ? p.slice(1) : p
          const filePath = path.join(process.cwd(), rel)
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        } catch (e) {
          // continuar tentando remover outros arquivos
          console.warn('Falha ao remover arquivo:', p, e.message)
        }
      }

      // tentar remover diretório do evento
      try {
        const dir = path.join(process.cwd(), 'uploads', 'events', id)
        if (fs.existsSync(dir)) {
          // usar rmSync quando disponível
          if (fs.rmSync) {
            try { fs.rmSync(dir, { recursive: true, force: true }) } catch(e) { fs.rmdirSync(dir, { recursive: true }) }
          } else {
            fs.rmdirSync(dir, { recursive: true })
          }
        }
      } catch (e) {
        console.warn('Falha ao remover diretório do evento:', e.message)
      }
    }

    await Evento.findByIdAndDelete(id)

    return res.status(200).json({ message: 'Evento e fotos removidos com sucesso.' })
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao deletar evento.', error: err.message })
  }
}

export const deleteEventPhoto = async (req, res) => {
  try {
    const { id, filename } = req.params
    const evento = await Evento.findById(id)
    if (!evento) return res.status(404).json({ message: 'Evento não encontrado.' })

    const expectedPath = `/uploads/events/${id}/${filename}`
    const photos = Array.isArray(evento.photos) ? evento.photos : []
    const idx = photos.indexOf(expectedPath)
    if (idx === -1) return res.status(404).json({ message: 'Foto não encontrada no evento.' })

    // Remover arquivo do disco
    try {
      const rel = expectedPath.startsWith('/') ? expectedPath.slice(1) : expectedPath
      const filePath = path.join(process.cwd(), rel)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch (e) {
      console.warn('Falha ao remover arquivo:', e.message)
    }

    // Remover do array e salvar
    photos.splice(idx, 1)
    evento.photos = photos
    await evento.save()

    // Tentar remover diretório se vazio
    try {
      const dir = path.join(process.cwd(), 'uploads', 'events', id)
      if (fs.existsSync(dir)) {
        const remaining = fs.readdirSync(dir)
        if (!remaining || remaining.length === 0) {
          if (fs.rmSync) {
            try { fs.rmSync(dir, { recursive: true, force: true }) } catch(e) { fs.rmdirSync(dir, { recursive: true }) }
          } else {
            fs.rmdirSync(dir, { recursive: true })
          }
        }
      }
    } catch (e) {
      console.warn('Falha ao remover diretório do evento após remoção de foto:', e.message)
    }

    return res.status(200).json({ message: 'Foto removida com sucesso.', photos: evento.photos || [] })
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao remover foto.', error: err.message })
  }
}
