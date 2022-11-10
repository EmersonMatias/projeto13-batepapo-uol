import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import joi from "joi"
import dayjs from "dayjs"

const app = express()

//configs
app.use(cors())
app.use(express.json())
const mongoClient = new MongoClient("mongodb://localhost:27017")
let dataBase;

// Conectando banco de Dados
mongoClient.connect().then(() => {
    dataBase = mongoClient.db("dbBatePapoUol")
}).catch((error) => { console.log(error) })

// Validação do nome do usuário
const nameSchema = joi.object({
    name: joi.string().alphanum().max(30).required()
})

// Validação da mensagem
const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("message", "private_message")
})

// CADASTRO DE USUÁRIO
app.post("/participants", (req, res) => {
    let newParticipant = req.body

    // Verificação que não é vazio
    const { error, value } = nameSchema.validate(newParticipant)
    if (error) {
        return res.status(422).send(error.message)
    }

    //Verificação se já existe nome na lista
    dataBase.collection("participants").find({ name: newParticipant.name }).toArray()
        .then((participants) => {
            if (participants.length) {
                return res.status(409).send("Esse nome já está sendo utilizado")
            } else {
                newParticipant = { name: newParticipant.name, lastStatus: Date.now() }
                let newMessage = { from: newParticipant.name, to: "Todos", text: "entra na sala...", type: "status", time: dayjs().format("HH:mm:ss") }

                // Inserindo novo Participante
                dataBase.collection("participants").insertOne(newParticipant)
                    .then((response) => {
                        //Inserindo mensagem de ingresso do participante
                        dataBase.collection("messages").insertOne(newMessage)
                            .then((response) => { res.status(200).send("OK") })
                            .catch((error) => { console.log(error) })
                    })
                    .catch((error) => { console.log(error) })
            }
        })
        .catch((error) => { console.log(error) })
})

// LISTA DE USUÁRIOS
app.get("/participants", (req, res) => {
    dataBase.collection("participants").find({}).toArray()
        .then((participants) => { res.status(200).send(participants) })
        .catch((error) => { console.log(error) })
})

// ENVIAR MENSAGENS
app.post("/messages", (req, res) => {
    let newMessage = req.body
    let user = req.headers.user
    const { error, value } = messageSchema.validate(newMessage)

    // Validação do to, text, type
    if (error) {
        return res.status(422).send(error.message)
    }
    // Verificando se participante existe
    dataBase.collection("participants").find({ name: user }).toArray()
        .then((participant) => {
            if (participant.length) {
                newMessage = { from: user, to: newMessage.to, text: newMessage.text, type: newMessage.type, time: dayjs().format("HH:mm:ss") }

                // Enviando a mensagem do participante
                dataBase.collection("messages").insertOne(newMessage)
                    .then((response) => { res.status(201).send(`Mensagem Enviada por ${console.log(user)}`) })
                    .catch((error) => { console.log(error) })
            } else {
                return res.status(422).send()
            }
        }).catch((error) => { console.log(error) })
})

// LISTA DE MENSAGENS
app.get("/messages", (req, res) => {
    let limit = req.query.limit
    let user = req.headers.user
    //return res.status(200).send(messages.slice(-limit).reverse()
    // Query String
    if (limit) {
        dataBase.collection("messages").find({ $or: [{ to: user }, { to: "Todos" }, { from: user }] }).toArray()
            .then((messages) => { return res.status(200).send(messages.slice(-limit).reverse()) })
            .catch((error) => { console.log(error) })
    } else {
        dataBase.collection("messages").find({ $or: [{ to: user }, { to: "Todos" }, { from: user }] }).toArray()
            .then((messages) => { return res.status(200).send(messages) })
            .catch((error) => { console.log(error) })
    }
})

//STATUS
app.post("/status", (req, res) => {
    let user = req.headers.user

    dataBase.collection("participants").find({ name: user }).toArray()
        .then((participant) => {
            if (participant.length) {
                dataBase.collection("participants").update({ name: user }, { $set: { lastStatus: Date.now() } })
                    .then(() => { return res.sendStatus(200) })
                    .catch((error) => { console.log() })


            } else {
                return res.send(404)
            }
        })
        .catch((error) => { console.log(error) })
})

//Remoção automática de usuários inativos
setInterval(() => {
    dataBase.collection("participants").find().toArray()
        .then((participants) => {
            participants.map((participant) => {
                let offStatus = Date.now() - participant.lastStatus
                if (offStatus > 10000) {
                    dataBase.collection("participants").deleteOne({ name: participant.name })
                        .then(() => {
                            let newMessage = { from: participant.name, to: "Todos", text: "sai da sala...", type: "status", time: dayjs().format("HH:mm:ss") }
                            dataBase.collection("messages").insertOne(newMessage)
                                .then(() => {console.log("Removido com sucesso")})
                                .catch((error) => {console.log(error)})
                        }).catch((error) => {console.log(error)})
                }
                console.log(participant.lastStatus)
            })
        })
        .catch((error) => { console.log(error) })
}, 15000)

app.listen(5000, () => { console.log("Server Running on port 5000") })