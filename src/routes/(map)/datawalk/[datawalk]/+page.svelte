<script lang="ts">
	import type { PageData } from "./$types";
	import { onMount, onDestroy } from "svelte";
	import * as turf from "@turf/turf";

	import maplibregl from "maplibre-gl";
	import type { Map } from "maplibre-gl";
	import "maplibre-gl/dist/maplibre-gl.css";

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

	let map: Map;

	const style : maplibregl.StyleSpecification = {
		version: 8,
		sources: {
			osm: {
				type: "raster",
				tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
				tileSize: 256,
				attribution: "&copy; Creative Coding Utrecht",
				maxzoom: 19
			}
		},
		layers: [
			{
				id: "osm",
				type: "raster",
				source: "osm" // This must match the source key above
			}
		]
	};

	let viewState = {
		zoom: 17.5,
		latitude: center.geometry.coordinates[1],
		longitude: center.geometry.coordinates[0],
		pitch: 30,
		bearing: 0
	};

	onMount(() => {
		map = new maplibregl.Map({
			container: "map",
			interactive: true,
			style: style,
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

			// map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
			map.addControl(new maplibregl.NavigationControl());
			map.addControl(
				new maplibregl.GeolocateControl({
					positionOptions: { enableHighAccuracy: true },
					trackUserLocation: true
				}),
				"top-right"
			);
			map.addControl(new maplibregl.ScaleControl({ maxWidth: 80, unit: "metric" }), "bottom-left");
		});
	});
</script>

<div id="map"></div>

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
