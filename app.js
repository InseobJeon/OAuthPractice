const express = require('express');
const morgan = require('morgan');
const session = require('express-session');
const app = express();
const axios = require('axios');

const port = 8000;

app.use(morgan('tiny'));
app.use(session ({
    secret: 'pravda',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}))

app.get('/callback', async (req, res) => {
    let userCode = await req.query.code
    axios.post('https://github.com/login/oauth/access_token', {
        client_id: "535d14a5308cacbed013",
        client_secret: process.env.PASSWORD,
        code: String(userCode)
    }).then(
        (res) => console.log(res.data)
    )
})

app.use(express.static(__dirname + '/public'))

app.listen(port, () => {
    console.log(`express now listen on ${port}`);
})
