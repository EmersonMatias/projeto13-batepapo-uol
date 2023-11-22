# Projeto 13 - API Bate-papo UOL
A API do Bate-papo UOL é um sistema que replica as funcionalidades essenciais de salas de bate-papo online, 
semelhante ao famoso serviço de chat da UOL. Este projeto é uma implementação do back-end para suportar salas
de bate-papo em tempo real.

### Formato de ```user```
```javascript
  {
    name: "User",
    last: 12313123
  }
```

### Formato de ```mensagem```
```javascript
  {
    from: "User",
    to: "Todos",
    text: "Oi pessoal",
    type: "message",
    time: "20:04:23"
  }
```

### 🟠POST ```/participants```
* Recebe pelo body um parâmetro ```name```, contendo o nome do participante
```javascript
  {
    name: "João"
  }
```
* Caso ```name``` seja diferente de string ou seja vazio retorna ```status code 422```
* Caso o nome já esteja sendo utilizado retorna ```status code 409```
* Salva o participante no banco de dados com formato:
```javascript
  {
    name: "User",
    lastStatus: Date.now()
  }
```
* Salva uma mensagem no banco de dados no formato:
```javascript
 {
    from: "User",
    to: "Todos",
    text: "User entrou na sala",
    type: "status",
    time: "HH:MM:SS"
}
```
* Caso não exista erro, retorna ```status code 201```.

### 🟢 GET ```/participants```
* Retorna a lista de todos os participantes


🟢 
🟠
