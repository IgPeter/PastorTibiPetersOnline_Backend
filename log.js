await User.findByIdAndUpdate(user_id, {isSubscriber: true}, 
    {lean: true, returnDocument: 'after'}).then(updatedUser => {

    const token = jwt.sign({
        userId: updatedUser.id,
        isAdmin: updatedUser.isAdmin,
        isSubscriber: updatedUser.isSubscriber
    }, secret , {expiresIn: '1d'})

    res.status(200).json({
        message: "User data updated successfully",
        result:updatedUser.isSubscriber,
        token: token
    });

    }).catch(err => {
    res.status(400).json({
        message: "Failed",
        error: err })
})
