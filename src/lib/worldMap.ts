import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { all as countries } from 'iso-3166-1';
import { feature } from 'topojson-client';
import atlas from 'world-atlas/countries-110m.json';

export type MapCountry = {
	code: string;
	name: string;
	path: string;
};

export function buildWorldMap(): MapCountry[] {
	const topology = atlas as unknown as Topology<{ countries: GeometryCollection }>;
	const collection = feature(
		topology,
		topology.objects.countries,
	) as unknown as FeatureCollection<Polygon | MultiPolygon, { name?: string }>;
	const visibleCollection: typeof collection = {
		...collection,
		features: collection.features.filter((country) => (
			country.geometry && country.properties?.name !== 'Antarctica'
		)),
	};
	const projection = geoNaturalEarth1().fitExtent([[2, 2], [358, 148]], visibleCollection);
	const path = geoPath(projection).digits(1);
	const codesByNumber = new Map(countries().map((country) => (
		[String(Number(country.numeric)), country.alpha2]
	)));

	return visibleCollection.features
		.map((country) => ({
			code: codesByNumber.get(String(Number(country.id))) ?? '',
			name: country.properties?.name ?? '',
			path: path(country) ?? '',
		}))
		.filter((country) => country.path);
}
