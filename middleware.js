function requireAdmin(req, res, next) {
    if (req.session["Admin"]) {
        return next()
    } else {
        res.redirect('/')
    }
}
function requireWriter(req, res, next) {
    if (req.session["Writer"]) {
        return next()
    } else {
        res.redirect('/')
    }
}

function requireUser(req, res, next) {
    if (req.session["User"]) {
        return next()
    } else {
        res.redirect('/')
    }
}

module.exports = {
    requireAdmin,
    requireWriter,
    requireUser
}