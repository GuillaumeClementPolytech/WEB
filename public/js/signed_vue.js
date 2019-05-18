"use strict"

Vue.component('carte-preview',{
	props: {
		carte:{
			required: true,
			type: Object
		}
	},
	template:`
	<div class="w3-container">

	<a :href="'/carte/' + carte.var_id"> 
	<img :src="carte.image_url" alt="Carte" class="w3-image w3-btn w3-border">
	</a>

	<div class="w3-row">

	<div class="w3-col s1" style="visibility: hidden">POS</div>

	<div class="w3-col s4">

	<button @click="like()" class="w3-button w3-btn w3-border"> Like </button>

	</div>

	<div class="w3-col s2" style="visibility: hidden">POS</div>

	<div class="w3-col s4">

	<button @click="dislike()" class="w3-button w3-btn w3-border"> Disike </button>

	</div>

	<div class="w3-col s1" style="visibility: hidden">POS</div>

	</div>

	<div class="w3-row">

	<div class="w3-col s1" style="visibility: hidden">POS</div>

	<div class="w3-col s10">

	<a :href="'/carte/' + carte.var_id">
	<button class="w3-button w3-border w3-btn w3-block"> Voir les commentaires </button> 
	</a>

	</div>

	<div class="w3-col s1" style="visibility: hidden">POS</div>

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
	<div class="w3-container w3-card">

	 <p> <a :href="url_user"> {{comm.name_user}} </a> dit le {{comm.created}} <span v-if="comm.edited">(edité le : {{comm.edited}})</span></p> 

	<p> {{comm.contenu}} </p>



	<button class="w3-button w3-btn" @click="fetchReply()"> Voir plus de reponses </button>

	<div class="reply_section w3-row">

	<div style="visibility: hidden" class="w3-col s1 m2 l3">
	LEFT
	</div>

	<div class="w3-col s11 m10 l9">

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
		dislike(repl) {
			this.$emit('disliked', repl)
		},
		fetchReply(){			

			fetch( "/api/comment/reply/" + this.comm.comment_id +"?nbr=6&offset=" + this.replys.length, { credentials: 'same-origin'})
			.then( (res) => {
				return res.json()
			} )
			.then( (res) => {
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
		}
	}
})


let app = new Vue({

	el: '#app',
	data: {
		cartes_preview : [],
		comments_preview : [],
		replys_preview : []
	},

	created: function(){

		fetch("/api/carte/bytop?nbr=12", { credentials: 'same-origin'})
		.then( (res) => {
			return res.json()
		} )
		.then( (res) => {
			this.cartes_preview = res
		} )
		.catch(function(error) {
			console.log('There has been a problem with initial fetch operation: ', error.message)
		})
		
		fetch("/api/comment/top?nbr=6", { credentials: 'same-origin'})
		.then( (res) => {
			return res.json()
		} )
		.then( (res) => {
			this.comments_preview = res
		} )
		.catch( function(error) {
			console.log('There has been a problem with initial fetch operation: ', error.message)
		})

		fetch("/api/users/replys?nbr=6", { credentials: 'same-origin'})
		.then( (res) => {
			return res.json()
		} )
		.then( (res) => {
			this.replys_preview = res
		} )
		.catch( function(error) {
			console.log('There has been a problem with initial fetch operation: ', error.message)
		})

	}, 
	methods : {
		liked_carte(carte) {//prend une carte et si la personne a deja (dis)like cette carte, et patch / put le like en requete TODO
			console.log(carte)
			return 
		},
		disliked_carte(carte) {
			console.log(carte)
			return
		},		
		liked_comm(comm) {//prend une carte et si la personne a deja (dis)like cette carte, et patch / put le like en requete
			console.log(comm)
			return 
		},
		disliked_comm(comm) {
			console.log(comm)
			return
		}

	}

})