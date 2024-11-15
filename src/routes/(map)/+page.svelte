<script lang="ts">
	import type { PageData } from './$types';
	import { onMount, onDestroy } from "svelte";
	
	import mapboxgl from "mapbox-gl";

	// https://vite.dev/guide/env-and-mode
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!MAPBOX_TOKEN) {
        throw new Error("MAPBOX_TOKEN is not set");
    }

	export let data: PageData;
	const { datawalks } = data;

	console.log("Datawalks:", datawalks);

	let mapElement;
	let map = null;
	let accessToken = MAPBOX_TOKEN;
	let mapStyle = "mapbox://styles/mapbox/light-v9";
	let viewState = {        
        zoom: 15,        
		longitude: 5.087679636388074,
		latitude: 52.10383316561075,
		pitch: 0,
		bearing: 0
	};

	onMount(() => {
		createMap();
	});

	function createMap() {
		map = new mapboxgl.Map({
			accessToken: accessToken,
			container: mapElement,
			interactive: true,
			style: mapStyle,
			center: [viewState.longitude, viewState.latitude],
			zoom: viewState.zoom,
			pitch: viewState.pitch,
			bearing: viewState.bearing
		});
	}

</script>

<div id="map" bind:this={mapElement}></div>

<style>
	#map {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: #e5e9ec;
		overflow: hidden;
	}
</style>
