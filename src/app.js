import express from 'express'
import { connectToDatabase } from './config/db.js'
import { router } from './routes/event.routes.js'
import cron from 'node-cron'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(cors({
    origin: '*'
}))

// `envPortOrUrl` pode conter um número (porta) ou uma URL completa (deploy).
const envPortOrUrl = process.env.PORT || 5000
const listenPort = parseInt(process.env.LISTEN_PORT || process.env.PORT, 10) || 5000

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

app.listen(envPortOrUrl, () => {
    console.log(`Servidor rodando na porta ${listenPort}`)
})

// Rota simples para health/check/keepalive
app.get('/keepalive', (req, res) => {
    return res.sendStatus(200)
})

// Keep-alive interno para impedir que plataformas que hibernam apliquem sleep
// Configurável: set KEEP_ALIVE=false para desabilitar, KEEP_ALIVE_INTERVAL_MS para intervalo
const KEEP_ALIVE = process.env.KEEP_ALIVE !== 'false'
const KEEP_ALIVE_INTERVAL_MS = parseInt(process.env.KEEP_ALIVE_INTERVAL_MS) || 60 * 1000
if (KEEP_ALIVE) {
    // Determinar base URL para o ping:
    let baseUrl
    const portOrUrl = envPortOrUrl || listenPort
    if (process.env.KEEP_ALIVE_URL) baseUrl = process.env.KEEP_ALIVE_URL.replace(/\/$/, '')
    else if (/^https?:\/\//.test(String(portOrUrl))) baseUrl = String(portOrUrl).replace(/\/$/, '')
    else baseUrl = `http://localhost:${listenPort}`

    const url = `${baseUrl}/keepalive`
    // ping imediato
    fetch(url).catch(e => console.warn('keepalive initial ping failed', e.message))

    setInterval(async () => {
        try {
            const res = await fetch(url)
            if (!res.ok) console.warn('keepalive ping non-ok', res.status)
        } catch (e) {
            console.warn('keepalive ping error', e.message)
        }
    }, KEEP_ALIVE_INTERVAL_MS)
}