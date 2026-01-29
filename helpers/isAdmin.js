const isAdmin = (req, res, next) => {
    if(!req.user.isAdmin){
        return res.status(401).send('This user is not an admin');
    }

    next();
}

module.exports = isAdmin;