<script lang="ts">
	import type { PageData } from "./$types";
	import { onMount, onDestroy } from "svelte";
	import * as turf from "@turf/turf";

	import mapboxgl from "mapbox-gl";

	// https://vite.dev/guide/env-and-mode
	const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
	if (!MAPBOX_TOKEN) {
		throw new Error("MAPBOX_TOKEN is not set");
	}

	export let data: PageData;
	const { datawalk, trackpoints } = data;

	console.log("Datawalk:", datawalk);
	console.log("Trackpoints:", trackpoints);

	const coordinates = trackpoints.map((trackpoint) => {
		return [trackpoint.longitude, trackpoint.latitude];
	});

	const center = turf.center(turf.points(coordinates));
	console.log("Center:", center.geometry.coordinates);

	console.log("Coordinates:", coordinates);

	let mapElement;
	let map = null;
	let accessToken = MAPBOX_TOKEN;
	let mapStyle = "mapbox://styles/mapbox/light-v9";
	let viewState = {
		zoom: 17.5,
		latitude: center.geometry.coordinates[1],
		longitude: center.geometry.coordinates[0],
		pitch: 40,
		bearing: 0
	};

	onMount(() => {
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

		map.on("load", () => {
			map.addSource("route", {
				type: "geojson",
				data: {
					type: "Feature",
					properties: {},
					geometry: {
						type: "LineString",
						coordinates: coordinates
					}
				}
			});

			map.addLayer({
				id: "route",
				type: "line",
				source: "route",
				layout: {
					"line-join": "round",
					"line-cap": "round"
				},
				paint: {
					"line-color": "#f0f",
					"line-width": 4,
					"line-opacity": 0.5,
					"line-dasharray": [2, 2]
				}
			});
		});
	});
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
