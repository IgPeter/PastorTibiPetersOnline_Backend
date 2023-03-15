const expressJwt = require("express-jwt");

    function authJwt(){
        
        const secret = process.env.SECRET_KEY;
        const api = process.env.API_URL;
        
        return expressJwt.expressjwt({
            secret,
            algorithms: ['HS256'],
            isRevoked: isRevoked
        }).unless({
            path: [
                {url: /\/public\/upload\/user(.*)/, methods: ['GET' , 'OPTIONS'] },
                {url: /\/public\/upload\/message(.*)/, methods: ['GET' , 'OPTIONS'] },
                `${api}/user/register`,
                `${api}/user/quickRegister`,
                `${api}/user/login`,
                `${api}/user/subscribe/:id`,
                { url: `${api}/user/`, method: ['POST', 'PATCH'] }
            ]
        })
        
    }

    async function isRevoked (req, token){
        
        const userId = token.payload.userId;
        const url = req.url;
        const isAdmin = token.payload.isAdmin;
        const isSubscriber = token.payload.isSubscriber;

        if(url === '/api/v1/message' &&  isAdmin == false && isSubscriber == true){
            return false
        }

        if (url === `/api/v1/user/subscribe/${userId}`  && isAdmin == false && isSubscriber == false){
               return false
        }

        if (url === `/api/v1/user/${userId}`  && isAdmin == false && isSubscriber == false){
            return false
         }

        if(!isAdmin){
            return true
        }
  }

    




    module.exports = authJwt;