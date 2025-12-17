import express from 'express'
import { connectToDatabase } from './config/db.js'
import { router } from './routes/event.routes.js'
import cron from 'node-cron'
import cors from 'cors'
import path from 'path'

const app = express()

app.use(cors({
    origin: '*'
}))

app.use(express.json())
app.use(router)

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

connectToDatabase()

function handleCreateDate(year) {
    const datas = []

    for(let mes = 0; mes < 12; mes++) {
        for (let dia = 1; dia <= new Date(year, mes + 1, 0).getDate(); dia++) {
            const data = new Date(year, mes, dia)

            datas.push(data)
        }
    }

    return datas.sort((a, b) => a - b)
}

app.get('/api/datas/:ano', (req, res) => {
    const ano = req.params.ano || 2025
    const dataOrdenadas = handleCreateDate(ano)
    const datasFormatadas = dataOrdenadas.map((data) => data.toLocaleDateString('pt-BR'))

    res.json(datasFormatadas)
})

app.listen('https://brubru.onrender.com', () => {
    console.log('Servidor rodando na porta 5000')
})