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
                { url: /\/api\/v1\/subscription(.*)/, methods: ['GET', 'POST', 'OPTIONS'] },
                { url: /\/api\/v1\/user(.*)/, methods: ['GET', 'OPTIONS', 'PATCH'] },
                { url: /\/api\/v1\/message(.*)/, methods: ['GET', 'OPTIONS','POST', 'PATCH', 'DELETE'] },
                { url: /\/api\/v1\/category(.*)/, methods: ['GET', 'OPTIONS'] },
                {url: /\/public\/upload\/user(.*)/, methods: ['GET' , 'OPTIONS'] },
                {url: /\/public\/upload\/message(.*)/, methods: ['GET' , 'OPTIONS'] },
                `${api}/user/register`,
                `${api}/user/quickRegister`,
                `${api}/user/login`,
                `${api}/user/subscribe/:id`,
            ]
        })
        
    }

    async function isRevoked (req, payload, done){

        if(!payload.isAdmin){
            done(null, true)
        }

        done();
        
       /* const userId = token.payload.userId;
        const urlParam = Object.keys(req.query) + '=' + req.query.contentType;
        const url = req.url;
        const isAdmin = token.payload.isAdmin;
        const isSubscriber = token.payload.isSubscriber;

        if(url === '/api/v1/message' &&  isAdmin == false && isSubscriber == true){
            return false
        }

        if(url === '/api/v1/category'  && isAdmin == true){
            return false
        }

        if (url === `/api/v1/message?${urlParam}` && isAdmin == false && isSubscriber == true){
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
        }*/
  }


exports.authJwt = authJwt;