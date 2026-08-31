import type { FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { all as countries } from 'iso-3166-1';
import { feature } from 'topojson-client';
import atlas from 'world-atlas/countries-110m.json';

export type MapCountry = {
	code: string;
	name: string;
	path: string;
};

function projectedPosition(position: Position): string {
	const [longitude = 0, latitude = 0] = position;
	return `${(longitude + 180).toFixed(1)},${(90 - latitude).toFixed(1)}`;
}

function ringPath(ring: Position[]): string {
	return `${ring.map((position, index) => (
		`${index === 0 ? 'M' : 'L'}${projectedPosition(position)}`
	)).join('')}Z`;
}

function geometryPath(geometry: Polygon | MultiPolygon): string {
	const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
	return polygons.flatMap((polygon) => polygon.map(ringPath)).join('');
}

export function buildWorldMap(): MapCountry[] {
	const topology = atlas as unknown as Topology<{ countries: GeometryCollection }>;
	const collection = feature(
		topology,
		topology.objects.countries,
	) as unknown as FeatureCollection<Polygon | MultiPolygon, { name?: string }>;
	const codesByNumber = new Map(countries().map((country) => (
		[String(Number(country.numeric)), country.alpha2]
	)));

	return collection.features
		.filter((country) => country.geometry && country.properties?.name !== 'Antarctica')
		.map((country) => ({
			code: codesByNumber.get(String(Number(country.id))) ?? '',
			name: country.properties?.name ?? '',
			path: geometryPath(country.geometry),
		}));
}
