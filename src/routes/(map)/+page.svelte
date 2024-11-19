<script lang="ts">
	import type { PageData } from "./$types";
	import type { Datawalk, Participant } from "$lib/database/types";

	export let data: PageData;
	const { datawalks } = data;

	console.log("Datawalks:", datawalks);
</script>

<div id="info">
	<img src="/images/pigeon.webp" width="60" alt="Pigeon" />
	Future Frictions &gt; Datawalk
</div>

<div id="datawalks">
	<h3>Datawalks</h3>
	<ul>
		{#each datawalks as datawalk}
			<li>
				<a href={`/datawalk/${datawalk.code}`}>{datawalk.code} - {datawalk.name}</a>
				<!-- ({#each datawalk.participants_current as participant}
					{#if participant.current_datawalk_id == datawalk.id}
						{participant.first_name}
					{/if}
				{/each}) -->
			</li>
		{/each}
	</ul>
</div>

<style>
	#info {
		display: flex;
		align-items: center;
		/* position: absolute; */
		padding-top: 20px;
		padding-left: 20px;
		font-family: Uni, sans-serif;
		text-transform: uppercase;
		font-size: 1.25rem;
	}

	#datawalks {
		padding-left: 20px;
	}
</style>
