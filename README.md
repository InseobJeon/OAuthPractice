# Making OAuth with github by JS from scratch

이제 한 번 OAuth 를 통한 github 인증 과정을 JS 로 구현해보려고 한다. `accessing data in an OAuth Server` 단락을 쭉 참고하고, PHP 로 작성된 코드를 최대한 JS 로 구현해볼 예정이다. 

## 0. SPEC

일단은 기본적으론 `express` 를 기반으로 서버를 구성하였으며, request 로깅을 위한 미들웨어로 `morgan` 을 사용하였다. `session` 객체 핸들링은 `express-session` 을, 그리고 외부에서 로컬로 접속할 수 있도록 하기 위해서 `ngrok` 을 사용하였다. 

## 1. github dev setting 에서 application 등록하기

일단은 외부에서 접속할 수 있도록 ngrok 을 통해 도메인을 만들어주었다. 나는 `8080` 포트를 사용하고 있기에, `ngrok http 8080` 을 통해 실행해주었다. 또, session 관련 처리는 `express-session` 을 이용하였다. 

추가로, ngrok 의 설치는 현재 macOS 를 사용하는 관계로 `brew cask install ngrok` 명령어를 통해 진행하였다. 

```bash
ngrok by @inconshreveable                                       (Ctrl+C to quit)
                                                                                
Session Status                online                                            
Session Expires               7 hours, 59 minutes                               
Version                       2.3.35                                            
Region                        United States (us)                                
Web Interface                 http://127.0.0.1:4040                             
Forwarding                    http://c8bcdd82693b.ngrok.io -> http://localhost:8
Forwarding                    https://c8bcdd82693b.ngrok.io -> http://localhost:
                                                                                
Connections                   ttl     opn     rt1     rt5     p50     p90       
                              0       0       0.00    0.00    0.00    0.00
```

이런 창이 나오는 걸 확인할 수 있었다. http 와 https 의 도메인이 존재하는데, 홈페이지 도메인으로는 http 를, 그리고 redirection 도메인으로는 https 를 사용하였다. 그 이유는 OAuth 의 문서에서 말 한 것처럼 redirection 용 링크는 https 를 사용하여 정보를 탈취할 수 있는 가능성을 조기차단하는 것이 좋다고 했기 때문이다. 

공식문서에서 나온대로 설정을 해 주었고, 보이진 않지만 위에 있는 client ID 와 client SECRET 또한 발급을 잘 받았다. postman 을 통해 보낸 GET request 도 잘 날아가고 있는 걸 확인할 수 있다. 

## 2. github API 를 참고해서 인증해보기

[OAuth Authorizations](https://docs.github.com/en/rest/reference/oauth-authorizations#get-or-create-an-authorization-for-a-specific-app)

> Deprecation Notice: GitHub will discontinue the OAuth Authorizations API, which is used by integrations to create personal access tokens and OAuth tokens, and you must now create these tokens using our web application flow. The OAuth Authorizations API will be removed on November, 13, 2020. For more information, including scheduled brownouts, see the blog post.

해당 문서를 보고있는데, OAuth authorizations API 가 조만간 사라지고(2020/10/13 부로), github 에서 제공하는 새로운 web application flow 를 통하여 token 을 발급하라는 이야기가 있었다. 그래서 해당 문서에 나와있는 API를 참조하기로 했다. 

[Authorizing OAuth Apps](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#web-application-flow)

```jsx
GET https://github.com/login/oauth/authorize
```

### 어떻게 보내지?

일단 이 API 를 보면서 가장 먼저 든 생각은, "어떻게 request 를 할까" 였다. 물론 기본적으로 지원하는 fetch 가 있지만, axios 라는 라이브러리를 통해서 request 를 하는 경우도 꽤 보았기 때문이다. 그래서 "axios vs fetch" 라는 키워드로 검색하니, 나랑 비슷한 고민을 하는 사람들이 많았고, 그중에서 그 고민에 대한 나름의 간단한 답을 찾을 수 있을 법한 글을 찾았다.

[[React / React Naive TIPS] axios 와 fetch 어떤 것을 사용할까?](https://hoorooroob.tistory.com/entry/React-React-Naive-TIPS-axios-%EC%99%80-fetch-%EC%96%B4%EB%96%A4-%EA%B2%83%EC%9D%84-%EC%82%AC%EC%9A%A9%ED%95%A0%EA%B9%8C)

18년도 글이긴 한데, 일단 fetch API 가 크게 바뀌었을 거 같진 않다는 생각이 들었다. 그리고 axios 문서를 들어가 보았는데 fetch 보다 조금 더 간결해 보였다. 이 글에서도 "axios 가 확실히 조금 더 편하게 사용할 수 있게 디자인되었다" 라는 이야기를 했는데, 그 이야기가 생각나며 약간 공감이 갔다. 

사실 모든 걸 차치하고서라도 axios 를 한 번도 사용해 본 적이 없기 때문에, axios 를 사용해 보자는 생각에 axios 를 사용해 보기로 했다. npm 옆의 weekly download 그래프도 도 쭉 올라가고 있으니 대세에 편승한다는 느낌으로다가, `npm install axios --save` 를 통해 설치해주었다. 

### axios 로 github API 에 요청하기

```jsx
const axios = require('axios');

let authRequest = () => {
    axios.get("https://github.com/login/oauth/authorize", {
        params: {
            client_id: "535d14a5308cacbed013",
            state: "pravda"
        }
    }).then(
        (res) => console.log(res)
    )
}
```

이런 식으로 요청을 보내보았다. `200` 코드가 잘 떴고, 무수한(...) 정보들이 쏟아져 나왔다. 그렇게 해서 건진 query string 의 `code` 를 express 의 `query` 를 통해서 `res.query.code` 로 접근하였다. 그 다음에는 그 값과 내 `client_id`, `client_secret` 을 통해 `[https://github.com/login/oauth/access_token](https://github.com/login/oauth/access_token)` 에 post 요청을 보내주었고, 그렇게 해서 받은 response 를 `res.data` 를 통해 접근하여 내 `access-token` 을 알아낼 수 있었다. 

```jsx
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
```

```bash
GET / 304 - - 3.377 ms
GET / 304 - - 1.322 ms
access_token=mytoken...&scope=&token_type=bearer
```

이제 이렇게 발행한 token 으로 API 를 사용하면 된다! 
