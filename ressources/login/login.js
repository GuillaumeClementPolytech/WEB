"use strict"

const express = require('express')
const router = express.Router()

const sjcl = require("sjcl")

const { Pool } = require('pg')

//connection a la BD
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: true
})

function escapeHtml(text) {
	if(typeof text != 'string'){
		return text
	}
  return text.replace(/[\"&<>]/g, function (a) {
    return { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' }[a]
  })
}


/* GET home page. */
router.get('/login', function(req, res, next) {

	res.render('login/log_form',{ vue: '', message : false})
	
})

router.get('/login/err', function(req, res, next) {

	res.render('login/log_form',{ vue: '', message : true})
	
})

router.get('/signin', function(req, res, next) {

	res.render('login/sign_form',{ vue: '', message : false})
	
})

router.get('/signin/err', function(req, res, next) {

	res.render('login/sign_form',{ vue: '', message : true})
	
})

//log in and out
router.post('/login', login)

router.get('/logout', logout)

router.post('/signin', sign)

// error handler
router.use( function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)

  //res.render('login/log_form',{message : 'Erreur, pas authentifié', vue: '<script src="/ressource/js/login_vue.js"></script>'})
  //console.log(err.message)
  res.redirect('/')

})


function login(req, res, next){ //post username, mot de passe, qui sont dans body de la request

	if(req.body.user_name && req.body.pass){

		//request enc_pass et salt
		let q = 'SELECT enc_pass, salt, id_user, name_user, admin_id FROM user_profile LEFT OUTER JOIN admin ON admin_id = id_user WHERE name_user=$1 '

		pool.query(q, [escapeHtml(req.body.user_name)], function(err,result) { 

			if(err || result == undefined || result.rows == undefined || result.rows[0] == undefined){
				return res.redirect('/login/login/err')
			}

			//encrypt pass passé en body
			const saltBits = sjcl.codec.base64.toBits(result.rows[0].salt)		
			const derivedKey = sjcl.misc.pbkdf2(req.body.pass, saltBits, 1000, 256)
			const key = sjcl.codec.base64.fromBits(derivedKey)

			//comparaison
			if(result.rows[0].enc_pass == key){

				//genere randoms bits
				const auth = sjcl.random.randomWords(8)
				const auth_code = sjcl.codec.base64.fromBits(saltBits)

				res.cookie('auth', auth_code, {maxAge : 1000*60*60*24, signed: true, secure: true})
				res.cookie('user_id', result.rows[0].id_user, {maxAge : 1000*60*60*24, signed: true, secure: true})
				res.cookie('user_name', result.rows[0].name_user, {maxAge : 1000*60*60*24, signed: true, secure: true})

				if(result.rows[0].admin_id){

					res.cookie('admin_id', result.rows[0].id_user, {maxAge : 1000*60*60*24, signed: true, secure: true})

				}
				
				res.redirect('/')

				putAuth(result.rows[0].id_user, auth_code)

				return
			} 

			return res.redirect('/login/login/err')

		})		

	}	else {
		res.redirect('/login/login/err')
	}

}

function sign(req, res, next){ //post username, mot de passe, date de naissance qui sont dans body de la request

	req.signedIn = false
	req.signedInAdmin = false

	if(req.body.user_name && req.body.pass && req.body.birth_date && req.body.pass_confirm ){

		if(req.body.pass != req.body.pass_confirm) {
			return res.redirect('/login/signin/err')
		}
		if(req.body.pass.length < 10) {
			return res.redirect('/login/signin/err')
		}

		let q1 = 'Select count(*) as n from user_profile where name_user = $1'

		let par1 = [escapeHtml(req.body.user_name)]

		pool.connect(function (err, client, done){

			const shouldAbort = function(err){
				console.log(err)
				if (err) {
					client.query('ROLLBACK', function (err) {
						done()
					})
				}
				return !!err
			}

			client.query('BEGIN', function(err){

				if (shouldAbort(err)) {
					return res.redirect('/login/signin/err')
				}
				client.query( q1, par1, function(err,result) {  

					if(shouldAbort(err)){
						return res.redirect('/login/signin/err')
					}

					if(result == undefined || result.rows == undefined || result.rows[0] == undefined){
						done()
						return res.redirect('/login/signin/err')
					}

					if (result.rows[0].n == 0 ){//si user n'existe pas encore

						const saltBits = sjcl.random.randomWords(8)
					const derivedKey = sjcl.misc.pbkdf2(req.body.pass, saltBits, 1000, 256)

					const key = sjcl.codec.base64.fromBits(derivedKey)
					const salt = sjcl.codec.base64.fromBits(saltBits)

					const auth_code_bits = sjcl.random.randomWords(8)
					const auth_code = sjcl.codec.base64.fromBits(auth_code_bits)

					const bday = new Date(escapeHtml(req.body.birth_date))

						//req
						let q = `INSERT INTO user_profile (name_user, enc_pass, salt, code_auth, birth_date) VALUES($1, $2, $3, $4, $5) RETURNING id_user`

						let par = [escapeHtml(req.body.user_name), key, salt, auth_code, bday]

						client.query( q, par, function(err,result) {

							if(shouldAbort(err)){
								return res.redirect('/login/signin/err')
							}  

							res.status(201)

							res.cookie('auth', auth_code, {maxAge : 1000*60*60*24, signed: true, secure: true})
							res.cookie('user_id', result.rows[0].id_user, {maxAge : 1000*60*60*24, signed: true, secure: true})

							res.redirect('/')

							client.query('COMMIT', function(err){
								done()
							})
						})

					}else{

						client.query('ROLLBACK', function (err) {
							done()
						})

						return res.redirect('/login/signin/err')

					}
				})
			})
		})
	} else {

		return res.redirect('/login/signin/err')

	}
}

function putAuth(user_id, auth_code){

	let q = `UPDATE user_profile SET code_auth = $1 WHERE id_user = $2`

	let par = [auth_code, escapeHtml(user_id)]

	pool.connect(function (err, client, done){

		const shouldAbort = function(err){
			if (err) {
				client.query('ROLLBACK', function (err) {
					done()
				})
			}
			return 
		}

		client.query('BEGIN', function(err){
			if (shouldAbort(err)) {
				return 
			}
			client.query( q, par, function(err,result) {  

				if(shouldAbort(err)){
					return 
				}

				client.query('COMMIT', function(err){
					done()
				})

			})
		})
	})
}


function clearAuth(user_id){

	let q = `UPDATE user_profile SET code_auth = $1 WHERE id_user = $2`

	let par = [null, escapeHtml(user_id)]

	pool.connect(function (err, client, done){

		const shouldAbort = function(err){
			if (err) {
				client.query('ROLLBACK', function (err) {
					done()
				})
			}
			return !!err
		}

		client.query('BEGIN', function(err){

			if (shouldAbort(err)) {
				return next({message: "Ceci n'est pas censé arriver", status: 500})
			}
			client.query( q, par, function(err,result) {  

				if(shouldAbort(err)){
					return next({message: "Ceci n'est pas censé arriver", status: 500})
				}

				client.query('COMMIT', function(err){

					done()
				})

				return

			})
		})
	})
}

function logout(req, res, next){ //get avec cookies auth et user_id

	if(req.signedCookies.user_id != undefined){

		clearAuth(req.signedCookies.user_id)

	}

	res.clearCookie('auth', { signed: true, secure: true})
	res.clearCookie('user_id', { signed: true, secure: true})
	res.clearCookie('admin_id', { signed: true, secure: true})
	res.clearCookie('user_name', { signed: true, secure: true})

	res.redirect('/')

}

module.exports = router