
function errorHandler (err, req, res, next) {

    //Jwt authorization error
    if(err.name === 'UnauthorizedError'){
        res.status(401).json({message: "The user is not really authorized"});
    }

    //Validation error
    if (err.name === 'ValidationError'){
        res.status(401).json({message: "The user is not validated"})
    }

    //General server error
    res.status(500).json({message: "Server error", error: err});

}


module.exports = errorHandler;