import mongoose from "mongoose"

const eventoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    descricao: {
        type: String,
        required: false
    },
    data_evento: {
        type: Date,
        required: true
    },
    localizacao: {
        type: String,
        required: false
    }
    ,
    photos: {
        type: [String],
        required: false,
        default: []
    }
}, { timestamps: false })

export const Evento = mongoose.model('Evento', eventoSchema)