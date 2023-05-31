const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {

    const secret = process.env.SECRET_KEY;
    const api = process.env.API_URL;
    const token = req.body.token || req.query.token || req.headers["x-access-token"];

    if(!token) {
        return res.status(403).send("The user is unauthorized");
    }

    try{ 
        const verifiedToken =  jwt.verify(token, secret);
        req.user = verifiedToken;
    }catch(err){
        res.status(401).send('Invalid token');
    }

    return next()
}

exports.verifyToken = verifyToken;