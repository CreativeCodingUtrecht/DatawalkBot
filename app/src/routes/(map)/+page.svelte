<script lang="ts">
	import type { PageData } from "./$types";
	import Header from "$lib/components/Header.svelte";

	export let data: PageData;
	const { datawalks } = data;

	console.log("Aggregated datawalks:", datawalks);
</script>

<div class="container w-full">
	<Header />
	
	<div class="container mx-auto p-8 space-y-8">
		<h4 class="h4">Datawalks</h4>
		<div class="w-full text-token grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each datawalks as datawalk}
				<a href={`/datawalk/${datawalk.code}`} class="card card-hover overflow-hidden">
					<div class="p-4 space-y-4">						
						<span class="text-xs">
							Code <b>{datawalk.code}</b>
						</span>
						<h6 class="h6" data-toc-ignore>{datawalk.name}</h6> 
						<a class="btn btn-sm btn-icon variant-ringed-primary" href={`/export/geojson/${datawalk.code}`} target="_new"><img src="/images/json.svg" width="22" alt="Export to GeoJSON"/></a>						
						<a class="btn btn-sm btn-icon variant-ringed-primary" href={`/export/archive/${datawalk.code}`} target="_new"><img src="/images/download.svg" width="22" alt="Download as ZIP"/></a>						
						<article>							
							{#if datawalk.contributingParticipants.length > 0}
							<p>
								Contributors:
							</p>
							<div class="w-full flex flex-wrap gap-1">
								{#each datawalk.contributingParticipants as participant}									
									<!-- {#if participant.current_datawalk_id == datawalk.id} -->
									<div class="space-y-2">
										<span class="chip bg-gradient-to-br variant-gradient-primary-tertiary">{participant.first_name}</span>
									</div>
									<!-- {/if} -->
								{/each}
							</div>
							<br />
							{/if}
							{#if datawalk.currentParticipants.length > 0}
							<p>
								Active participants:
							</p>
							<div class="w-full flex flex-wrap gap-1">
								{#each datawalk.currentParticipants as participant}									
									<!-- {#if participant.current_datawalk_id == datawalk.id} -->
									<div class="space-y-2">
										<span class="chip bg-gradient-to-br variant-gradient-tertiary-secondary">{participant.first_name}</span>
									</div>
									<!-- {/if} -->
								{/each}
							</div>
							{/if}															
						</article>
					</div>
				</a>
			{/each}
		</div>
	</div>
</div>

