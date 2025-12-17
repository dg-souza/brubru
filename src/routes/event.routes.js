import express from 'express'
import { createEvent, getAllEvents, getCalendarioComEventos, getEventoById, uploadEventPhotos, listEventPhotos, getEventPhoto, upload, updateEvent, deleteEvent, deleteEventPhoto } from '../controllers/event.controller.js'

export const router = express.Router()

router
.get('/eventos', getCalendarioComEventos)
.get('/eventos/:id', getEventoById)
.post('/eventos', createEvent)

// Atualizar e deletar evento
.put('/eventos/:id', updateEvent)
.delete('/eventos/:id', deleteEvent)

// Fotos
.post('/eventos/:id/fotos', upload.array('photos', 10), uploadEventPhotos)
.get('/eventos/:id/fotos', listEventPhotos)
.get('/eventos/:id/fotos/:filename', getEventPhoto)
// Deletar foto individual
.delete('/eventos/:id/fotos/:filename', deleteEventPhoto)