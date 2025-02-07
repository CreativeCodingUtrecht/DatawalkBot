<script lang="ts">
	import type { PageData } from "./$types";
	import { onMount } from "svelte";
	import * as turf from "@turf/turf";
	import type { TrackPoint } from "$lib/database/types";
	import { colorFromRange, css } from "@thi.ng/color";
	import Header from "$lib/components/Header.svelte";
	import { page } from '$app/stores';

	import maplibregl from "maplibre-gl";
	import "maplibre-gl/dist/maplibre-gl.css";
	import type { Map, LngLatBounds, StyleSpecification } from "maplibre-gl";
	
	export let data: PageData;
	const { datawalk } = data;

	const coordinatesAll: any = [];
	let totalDistance : number = 0;
	for (const participant of datawalk.participants_contributing) {
		console.log("Participant:", participant);
		const coordinates = participant.trackpoints.map((trackpoint: TrackPoint) => {
			return [trackpoint.longitude, trackpoint.latitude];
		});
		coordinatesAll.push(...coordinates);

		if (coordinates.length > 2) {
			const line = turf.lineString(coordinates);
			const distance = turf.length(line, { units: "meters" });
			console.log("Participant:", participant.first_name, "Distance:", distance);
			totalDistance += distance;
		}
	}

	console.log("Total distance:", totalDistance);

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

	const style : StyleSpecification = {
		version: 8,
		sources: {
			osm: {
				type: "raster",
				tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
				tileSize: 256,
				attribution: "&copy; <a href='https://creativecodingutrecht.nl' target='_new'>Creative Coding Utrecht</a>",
				maxzoom: 19
			}
		},
		layers: [
			{
				id: "osm",
				type: "raster",
				source: "osm" 
			}
		]
	};

	let viewState = {
		zoom: 17.5,
		latitude: latitude,
		longitude: longitude,
		pitch: 0,
		bearing: 0
	};

	onMount(() => {
		const url = $page.url;
		const showParticipantFirstName = $page.url.searchParams.get('first_name');
		const showParticipantUsername = $page.url.searchParams.get('username');
		const showTrackpoints = $page.url.searchParams.get('hide') === "" ? false : true;

		map = new maplibregl.Map({
			container: "map",
			interactive: true,
			style: style,
			center: [viewState.longitude, viewState.latitude],
			zoom: viewState.zoom,
			pitch: viewState.pitch,
			bearing: viewState.bearing,
			attributionControl: false
		});

		map.addControl(new maplibregl.FullscreenControl());
		map.addControl(new maplibregl.NavigationControl());
		map.addControl(
			new maplibregl.AttributionControl({
				customAttribution:
					'Datawalk Bot'
			})
		);

		if (bbox) {
			map.fitBounds(bbox, {
				padding: viewState.pitch
			});
			map.setPitch(45);
		}

		const overallStatistics = {
			distance: 0,
			totalDatapoints: 0,
			datapoints: {
				photo: 0,
				video: 0,
				audio: 0,
				text: 0
			}
		}

		map.on("load", () => {
			for (let participant of datawalk.participants_contributing) {
				const layerId = `layer-${participant.uuid}`;
				let userStatistics = {
					participant: participant.uuid,
					distance: 0,
					totalDatapoints: 0,
					datapoints: {
						photo: 0,
						video: 0,
						audio: 0,
						text: 0
					}
				}

				if (showParticipantFirstName && participant.first_name !== showParticipantFirstName) {
					continue;
				} else if (showParticipantUsername && participant.username !== showParticipantUsername) {
					continue;
				}

				const color = css(colorFromRange("neutral"));

				const coordinates = participant.trackpoints.map((trackpoint: TrackPoint) => {
					return [trackpoint.longitude, trackpoint.latitude];
				});

				if (coordinates.length > 2) {
					const line = turf.lineString(coordinates);
					const distance = turf.length(line, { units: "meters" });
					userStatistics.distance = distance;
				}

				// Show trackpoints
				if (showTrackpoints) {
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
				}

				for (const trackpoint of participant.trackpoints) {
					let i=0;
					for (const datapoint of trackpoint.datapoints) {
						let html;
						if (datapoint.media_type === "text") {
							html = `${datapoint.created_at}<br/><b>${participant.first_name}</b> shared a thought<br /><br /><b>${datapoint.caption}</b><br />`
						} else {
							html = `${datapoint.created_at}<br/><b>${participant.first_name}</b> shared a <a href="/media/${datapoint.uuid}" target="_new">${datapoint.media_type}</a><br /><br />${datapoint.media_type == "photo" ? `<img width=200 src="/media/${datapoint.uuid}"><br />` : ""}${datapoint.caption ? `<b>${datapoint.caption}</b><br />` : ""}`
						} 

						switch(datapoint.media_type) {
							case "text":
								userStatistics.datapoints.text++;
								break;
							case "photo":
								userStatistics.datapoints.photo++;
								break;
							case "video":
								userStatistics.datapoints.video++;
								break;
							case "audio":
								userStatistics.datapoints.audio++;
								break;
						}

						const popup = new maplibregl.Popup({ offset: 25 })
							.setHTML(
								html
							)
							.setMaxWidth("400px");

						let marker;
						if (datapoint.media_type !== "photo") {
							marker = new maplibregl.Marker({ color });
						} else {
							const el = document.createElement("div");
							el.className = "imagemarker";
							el.style.backgroundImage = `url(/media/${datapoint.uuid})`;
							el.style.width = `40px`;
							el.style.height = `40px`;
							el.style.backgroundSize = "100%";
							el.style.border = `2px solid ${color}`;

							marker = new maplibregl.Marker({element: el});
						}

						marker
							.setLngLat([trackpoint.longitude+(i*0.000001), trackpoint.latitude+(i*0.0000001)])
							.setPopup(popup)
							.addTo(map);
						
						i++;
						userStatistics.totalDatapoints++;
					}
				}

				// Create a popup, but don't add it to the map yet.
				const popup = new maplibregl.Popup({
					closeButton: false,
					closeOnClick: false
				});

				map.on("mouseenter", layerId, (e) => {
					map.getCanvas().style.cursor = "pointer";
					const coordinates = e.lngLat;
					const description = `<b>${participant.first_name}</b> walked <b>${userStatistics.distance.toFixed(0)}m</b> and collected <b>${userStatistics.totalDatapoints}</b> datapoints`;
					popup.setLngLat(coordinates).setHTML(description).addTo(map);
				});

				map.on("mouseleave", layerId, () => {
					map.getCanvas().style.cursor = "";
					popup.remove();
				});

				overallStatistics.distance += userStatistics.distance;
				overallStatistics.totalDatapoints += userStatistics.totalDatapoints;
				overallStatistics.datapoints.photo += userStatistics.datapoints.photo;
				overallStatistics.datapoints.video += userStatistics.datapoints.video;
				overallStatistics.datapoints.audio += userStatistics.datapoints.audio;
				overallStatistics.datapoints.text += userStatistics.datapoints.text;
			}

			console.log("Overall statistics:", overallStatistics);
		});
	});
</script>

<div id="map"></div>
<Header absolute={true} title={datawalk.name} />
<div class="card p-4">
	Basic
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

	:global(.maplibregl-popup) {
		font-family: "Quicksand", sans-serif;
	}
</style>
