<script lang="ts">
	import type { PageData } from './$types';
	
	export let data: PageData;
	const { datawalks } = data;

	console.log("Datawalks:", datawalks);
</script>

<h1>Datawalks</h1>
<ul>
	{#each datawalks as datawalk}
		<li>
			<a href="{`/datawalk/${datawalk.code}`}">{datawalk.code} - {datawalk.name}</a>
		</li>
	{/each}
</ul>