const axios = require('axios');


let authRequest = () => {
    axios.get("https://github.com/login/oauth/authorize", {
        params: {
            client_id: "535d14a5308cacbed013",
            state: "pravda",
            redirect_uri: "https://eeee703486fc.ngrok.io/callback"
        }
    }).then(
        (res) => console.log(res)
    )
}

document.body.getElementById('gitLogin').addEventListener('click', () => {
    authRequest();
});