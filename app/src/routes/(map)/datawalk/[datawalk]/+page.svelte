<script lang="ts">
	import type { PageData } from "./$types";
	import { onMount } from "svelte";
	import * as turf from "@turf/turf";
	import type { TrackPoint } from "$lib/database/types";
	import { colorFromRange, css } from "@thi.ng/color";

	import mapboxgl from "mapbox-gl";
	import "mapbox-gl/dist/mapbox-gl.css";
	import type { Map, LngLatBounds } from "mapbox-gl";

	// https://vite.dev/guide/env-and-mode
	const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
	if (!MAPBOX_TOKEN) {
		throw new Error("MAPBOX_TOKEN is not set");
	}

	export let data: PageData;
	const { datawalk } = data;

	// console.log("Datawalk:", datawalk);
	// console.log("Participating: ", datawalk.participants_contributing);

	const coordinatesAll: any = [];

	for (const participant of datawalk.participants_contributing) {
		console.log("Participant:", participant);
		const coordinates = participant.trackpoints.map((trackpoint: TrackPoint) => {
			return [trackpoint.longitude, trackpoint.latitude];
		});
		coordinatesAll.push(...coordinates);
	}

	// Default to CCU as center of the map
	let latitude = 52.1046924;
	let longitude = 5.0862398;
	let bbox : LngLatBounds;
	
	if (coordinatesAll.length > 0) {
		const center = turf.center(turf.points(coordinatesAll));
		console.log("Center:", center.geometry.coordinates);
		latitude = center.geometry.coordinates[1];
		longitude = center.geometry.coordinates[0];

		bbox = turf.bbox(turf.points(coordinatesAll));
	}

	let map: Map;
	let accessToken = MAPBOX_TOKEN;
	let mapStyle = "mapbox://styles/mapbox/light-v9";
	let viewState = {
		zoom: 18,
		latitude: latitude,
		longitude: longitude,
		pitch: 45,
		bearing: 0
	};

	onMount(() => {
		map = new mapboxgl.Map({
			accessToken: accessToken,
			container: "map",
			interactive: true,
			style: mapStyle,
			center: [viewState.longitude, viewState.latitude],
			zoom: viewState.zoom,
			pitch: viewState.pitch,
			bearing: viewState.bearing,
			attributionControl: false
		});

		map.addControl(new mapboxgl.FullscreenControl());
		map.addControl(new mapboxgl.NavigationControl());
		map.addControl(
			new mapboxgl.AttributionControl({
				customAttribution:
					'<a href="https://creativecodingutrecht.nl" target="_new">Creative Coding Utrecht</a>'
			})
		);

		if (bbox) {
			map.fitBounds(bbox, {
				padding: viewState.pitch
			});
			map.setPitch(45);
		}

		map.on("load", () => {
			for (let participant of datawalk.participants_contributing) {
				const color = css(colorFromRange("neutral"));

				const coordinates = participant.trackpoints.map((trackpoint: TrackPoint) => {
					return [trackpoint.longitude, trackpoint.latitude];
				});

				// Show trackpoints
				map.addSource(`trackpoints-${participant.uuid}`, {
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

				const layerId = `layer-${participant.uuid}`;
				map.addLayer({
					id: layerId,
					type: "line",
					source: `trackpoints-${participant.uuid}`,
					layout: {
						"line-join": "round",
						"line-cap": "round"
					},
					paint: {
						"line-color": color,
						"line-width": 4,
						"line-opacity": 0.5,
						"line-dasharray": [4, 2]
					}
				});

				// Create a popup, but don't add it to the map yet.
				const popup = new mapboxgl.Popup({
					closeButton: false,
					closeOnClick: false
				});

				map.on("mouseenter", layerId, (e) => {
					// console.log("Mouse enter:", e);
					// Change the cursor style as a UI indicator.

					map.getCanvas().style.cursor = "pointer";
					const coordinates = e.lngLat;
					const description = `<b>${participant.first_name}</b>`;
					popup.setLngLat(coordinates).setHTML(description).addTo(map);
				});

				map.on("mouseleave", layerId, () => {
					map.getCanvas().style.cursor = "";
					popup.remove();
				});

				for (const trackpoint of participant.trackpoints) {
					for (const datapoint of trackpoint.datapoints) {
						const popup = new mapboxgl.Popup({ offset: 25 })
							.setHTML(
								`${datapoint.created_at}<br/><b>${participant.first_name}</b> shared thisl <a href="/media/${datapoint.uuid}" target="_new">${datapoint.media_type}</a><br /><br />${datapoint.media_type == "photo" ? `<img width=200 src="/media/${datapoint.uuid}"><br />` : ""}${datapoint.caption ? `<b>${datapoint.caption}</b><br />` : ""}`
							)
							.setMaxWidth("400px");

						let marker;
						if (datapoint.media_type !== "photo") {
							marker = new mapboxgl.Marker({ color });
						} else {
							const el = document.createElement("div");
							el.className = "imagemarker";
							el.style.backgroundImage = `url(/media/${datapoint.uuid})`;
							el.style.width = `40px`;
							el.style.height = `40px`;
							el.style.backgroundSize = "100%";
							el.style.border = `2px solid ${color}`;

							marker = new mapboxgl.Marker(el);
						}

						marker
							.setLngLat([trackpoint.longitude, trackpoint.latitude])
							.setPopup(popup)
							.addTo(map);
					}
				}
			}
		});
	});
</script>

<div id="map"></div>
<div id="info">
	<img src="/images/pigeon.webp" width="60" alt="Pigeon" />
	Future Frictions &gt; {datawalk.name}
</div>

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

	:global(.imagemarker) {
		display: block;
		border: none;
		border-radius: 50%;		
		cursor: pointer;
		padding: 0;
	}

	:global(.mapboxgl-popup) {
		font-family: "Quicksand", sans-serif;
	}

	#info {
		display: flex;
		align-items: center;
		position: absolute;
		top: 20px;
		left: 20px;
		font-family: Uni, sans-serif;
		text-transform: uppercase;
		font-size: 1.25rem;
	}

</style>
