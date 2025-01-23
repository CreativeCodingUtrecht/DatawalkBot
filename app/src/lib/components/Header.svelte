<script lang="ts">
	export let absolute : boolean = false;
	export let title : string = "";

	const navigate = () => {
		window.history.back();
	}
</script>

<div id="info" style:position={absolute ? 'absolute' : 'relative'} on:click={navigate}>
    <img src="/images/pigeon.webp" width="60" alt="Pigeon" />
    Datawalk Bot {title !== "" ? `> ${title}` : ""}
</div>

<style>
	#info {
		display: flex;
		align-items: center;		
		padding-top: 20px;
		padding-left: 20px;
		font-family: Uni, sans-serif;
		text-transform: uppercase;
		font-size: 1.25rem;
		cursor: pointer;
	}

</style>

