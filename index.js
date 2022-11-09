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


mongoClient.connect().then(() => {
    dataBase = mongoClient.db("dbBatePapoUol")
}).catch((error) => { console.log(error) })


// Padrão de validação do nome do usuário
const nameSchema = joi.object({
    name: joi.string().alphanum().max(30).required()
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
                let newMessage = { from: newParticipant.name, to: "Todos", text: "entra na sala...", type: "status", time: 0, time: dayjs().format("HH:MM:ss") }

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

// LISTA DE MENSAGENS
app.get("/messages", (req, res) => {
    dataBase.collection("messages").find().toArray()
        .then((messages) => { res.status(200).send(messages) })
        .catch((error) => { console.log(error) })
})


app.listen(5000, () => { console.log("Server Running on port 5000") })