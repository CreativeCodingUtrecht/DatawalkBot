<script lang="ts">
	import type { PageData } from './$types';
	import type { Datawalk, Participant } from '$lib/database/types';
	
	export let data: PageData;
	const { datawalks } = data;

	console.log("Datawalks:", datawalks);
</script>

<h1>Datawalks</h1>
<ul>
	{#each datawalks as datawalk}
		<li>
			<a href="{`/datawalk/${datawalk.code}`}">{datawalk.code} - {datawalk.name}</a> 
			({#each datawalk.participants_current as participant}
				{#if participant.current_datawalk_id == datawalk.id}
					{participant.first_name}
				{/if}
			{/each})
		</li>
	{/each}
</ul>