"use strict"

const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', function(req, res, next) {

	if (req.signedIn){

		res.render('accueil/signed',{ vue: '<script src="/ressource/js/signed_vue.js"></script>', id: req.signedCookies.user_id})

	} else {

		res.render('accueil/index',{ vue: '<script src="/ressource/js/accueil_vue.js"></script>'})
	}
})

module.exports = router
