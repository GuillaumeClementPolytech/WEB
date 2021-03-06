"use strict"

Vue.component('carte-preview',{
	props: {
		carte:{
			required: true,
			type: Object
		}
	},
	template:`
	<div class="w3-card w3-margin-bottom">

	<a :href="'/carte/' + carte.var_id"> 
	<img :src="carte.image_url" alt="Carte" class="w3-image  w3-margin-bottom">
	</a>

	<div class="w3-row  w3-margin-bottom">

	<div class="w3-col s1" style="visibility: hidden">LEFT</div>

	<div class="w3-col s4">

	<button @click="like()" class="w3-button w3-btn w3-border w3-light-blue"> Like </button>

	</div>

	<div class="w3-col s2" style="visibility: hidden">MIDDLE</div>

	<div class="w3-col s4">

	<button @click="dislike()" class="w3-button w3-btn w3-border w3-pale-red"> Disike </button>

	</div>

	<div class="w3-col s1" style="visibility: hidden">RIGHT</div>

	</div>

	<div class="w3-row  w3-margin-bottom">

	<div class="w3-col s1" style="visibility: hidden">LEFT</div>

	<div class="w3-col s10">

	<a :href="'/carte/' + carte.var_id">
	<button class="w3-button w3-border w3-btn w3-block w3-light-green"> Voir les commentaires </button> 
	</a>

	</div>

	<div class="w3-col s1" style="visibility: hidden">RIGHT</div>

	</div>

	</div>
	`,
	methods: {
		like() {
			this.$emit('liked', this.carte)
		},
		dislike() {
			this.$emit('disliked', this.carte)
		},
	},

})



Vue.component('comment-preview',{
	props: {
		comm:{
			required: true,
			type: Object
		}
	},
	template:`
	<div class="w3-container w3-card w3-margin-bottom w3-left-align">

	<p> <a :href="url_user"> {{comm.name_user}} </a> dit le {{comm.created}} <span v-if="comm.edited">(edité le : {{comm.edited}})</span> sur <a :href="carte">cette carte</a>: </p> 

	<div class="w3-card">

	<p> {{comm.contenu}} </p>

	</div>

	<div class="w3-row">

	<button class="w3-button w3-btn w3-border w3-light-blue" @click="like()"> Like </button>

	<button class="w3-button w3-btn w3-border w3-pale-red" @click="dislike()"> Dislike </button>

	</div>

	<button class="w3-button w3-btn w3-border" @click="fetchReply()"> Voir plus de reponses </button>

	<div class="reply_section w3-row">

	<div style="visibility: hidden" class="w3-col m1 l1">
	LEFT
	</div>

	<div class="w3-col s12 m11 l11">

	<comment-preview v-for="repl in replys" :key="repl.comment_id" :comm="repl" @liked="liked_fils(repl)" @disliked="disliked_fils(repl)"> </comment-preview>

	</div>
	
	</div>

	</div>
	`,
	data(){
		return {
			replys : []
		}
	},
	methods: {
		like() {
			this.$emit('liked', this.comm)
		},
		dislike() {
			this.$emit('disliked', this.comm)
		},
		liked_fils(repl) {
			this.$emit('liked', repl)
		},
		disliked_fils(repl) {
			this.$emit('disliked', repl)
		},
		fetchReply(){			

			fetch( "/api/comment/reply/" + this.comm.comment_id +"?nbr=6&offset=" + this.replys.length, { credentials: 'same-origin'})
			.then( (res) => {
				return res.json()
			} )
			.then( (res) => {
				let c
				for (c in res){
					res[c].created = (new Date(res[c].created)).toLocaleDateString()
					if (res[c].edited){
						res[c].edited = (new Date(res[c].edited)).toLocaleDateString()
					}
				}
				this.replys = this.replys.concat(res)
			} )
			.catch( function(error) {
				console.log('There has been a problem with reply fetch operation: ', error.message)
			})

		}
	},
	computed : {
		url_user (){
			return '/user/' + this.comm.author_id
		},
		carte (){
			return '/carte/' + this.comm.carte_id
		}
	}
})



let app = new Vue({

	el: '#app',
	data: {
		cartes_preview : [],
		comments_preview : [],
		id : -1,
		name: ''
	},

	created: function(){

		this.id = document.getElementById("id_user").innerHTML

		fetch("/api/users/likes/"+this.id+"?nbr=6", { credentials: 'same-origin'}) //fetch les comm de user
		.then( (res) => {
			return res.json()
		} )
		.then( (res) => {
			this.cartes_preview = res
		} )
		.catch( function(error) {
			console.log('There has been a problem with initial fetch operation: ', error.message)
		})

		fetch("/api/users/comments/"+this.id+"?nbr=6", { credentials: 'same-origin'}) //fetch les comm de user
		.then( (res) => {
			return res.json()
		} )
		.then( (res) => {
			this.comments_preview = res
			let c
			for (c in this.comments_preview){
				this.comments_preview[c].created = (new Date(this.comments_preview[c].created)).toLocaleDateString()
				if (this.comments_preview[c].edited){
					this.comments_preview[c].edited = (new Date(this.comments_preview[c].edited)).toLocaleDateString()
				}
			}
		} )
		.catch( function(error) {
			console.log('There has been a problem with initial fetch operation: ', error.message)
		})

		fetch("/api/users/id/"+this.id, { credentials: 'same-origin'})
		.then((res) => {
			return res.json()
		})
		.then( (res) => {
			this.name = res.name_user
		} )
		.catch( function(error) {
			console.log('There has been a problem with initial fetch operation: ', error.message)
		})

	}, 
	methods : {
		liked_carte(carte) {//prend une carte et si la personne a deja (dis)like cette carte, et patch / put le like en requete TODO
			fetch("/api/carte/like/"+carte.var_id, { credentials: 'same-origin', method : 'PUT'})
			.then((res)=>{
				console.log(res)
			})
		},
		disliked_carte(carte) {
			fetch("/api/carte/dislike/"+carte.var_id, { credentials: 'same-origin', method : 'PUT'})
			.then((res)=>{
				console.log(res)
			})
		},		
		fetch_cartes(){

			fetch( "/api/users/likes/"+this.id+"?nbr=6&offset=" + this.cartes_preview.length, { credentials: 'same-origin'})
			.then( (res) => {
				return res.json()
			} )
			.then( (res) => {
				this.cartes_preview = this.cartes_preview.concat(res)
			} )
			.catch( function(error) {
				console.log('There has been a problem with reply fetch operation: ', error.message)
			})

		},		
		liked_comm(comm) {//prend une carte et si la personne a deja (dis)like cette carte, et patch / put le like en requete
			fetch("/api/comment/like/"+comm.comment_id, { credentials: 'same-origin', method : 'PUT'})
			.then((res)=>{
				console.log(res)
			})
		},
		disliked_comm(comm) {
			fetch("/api/comment/dislike/"+comm.comment_id, { credentials: 'same-origin', method : 'PUT'})
			.then((res)=>{
				console.log(res)
			})
		},
		fetch_comm(){

			fetch("/api/users/comments/"+ this.id + "?nbr=6&offset=" + this.comments_preview.length, { credentials: 'same-origin'})
			.then( (res) => {
				return res.json()
			} )
			.then( (res) => {
				
				let c
				for (c in res){
					res[c].created = (new Date(res[c].created)).toLocaleDateString()
					if (res[c].edited){
						res[c].edited = (new Date(res[c].edited)).toLocaleDateString()
					}
				}
				this.comments_preview = this.comments_preview.concat(res)

			} )
			.catch( function(error) {
				console.log('There has been a problem with reply fetch operation: ', error.message)
			})

		},

		supprimerCompte(){

			fetch("/api/users/", { credentials: 'same-origin', method : 'DELETE'})
			.then((res)=>{
				console.log(res)
			})

		}

	}

})