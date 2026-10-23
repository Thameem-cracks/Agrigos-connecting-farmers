"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { geoCentroid, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { profilePath, type Farmer } from "@/lib/client";

const countries = feature(world as any, (world as any).objects.countries) as any;
const countryAliases: Record<string, string> = { "united states of america": "united states", "usa": "united states", "uk": "united kingdom", "uae": "united arab emirates", "czech republic": "czechia", "south korea": "south korea", "russian federation": "russia" };
const countryLocations = new Map<string, [number, number]>(countries.features.map((country: any) => [String(country.properties?.name ?? "").toLowerCase(), geoCentroid(country)]));
function farmerLocation(farmer: Farmer, index: number): [number, number] | null {
  if (farmer.mapVisible && farmer.latitude != null && farmer.longitude != null) return [farmer.longitude, farmer.latitude];
  const name = farmer.country.trim().toLowerCase();
  const center = countryLocations.get(countryAliases[name] ?? name);
  if (!center) return null;
  const ring = Math.floor(index / 8) + 1;
  const angle = index * Math.PI * 2 / 8;
  return [center[0] + Math.cos(angle) * ring * 1.8, center[1] + Math.sin(angle) * ring * 1.8];
}
const SIZE = 600;
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 4.5;
type Point = { x: number; y: number };

export function FarmerGlobe({ farmers, query }: { farmers: Farmer[]; query: string }) {
  const [rotation, setRotation] = useState<[number, number]>([-18, -18]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; rotation: [number, number] } | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ distance: number; midpoint: Point; zoom: number; pan: Point } | null>(null);
  const suppressClick = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  function svgPoint(point: Point): Point {
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return { x: SIZE / 2, y: SIZE / 2 };
    return { x: (point.x - bounds.left) * SIZE / bounds.width, y: (point.y - bounds.top) * SIZE / bounds.height };
  }

  function pinchGeometry() {
    const [first, second] = [...pointers.current.values()];
    if (!first || !second) return null;
    return {
      distance: Math.hypot(second.x - first.x, second.y - first.y),
      midpoint: svgPoint({ x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }),
    };
  }

  function changeZoom(nextZoom: number, focus: Point, fromZoom = zoom, fromPan = pan) {
    const bounded = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    const factor = bounded / fromZoom;
    setZoom(bounded);
    setPan({
      x: focus.x - SIZE / 2 - (focus.x - SIZE / 2 - fromPan.x) * factor,
      y: focus.y - SIZE / 2 - (focus.y - SIZE / 2 - fromPan.y) * factor,
    });
  }

  useEffect(() => {
    if (!query.trim() || !farmers.length) return;
    const first = farmers.find((farmer) => farmerLocation(farmer, 0));
    if (first) { const point = farmerLocation(first, 0)!; setRotation([-point[0], -point[1]]); }
  }, [query, farmers]);

  const projection = useMemo(() => geoOrthographic()
    .translate([SIZE / 2 + pan.x, SIZE / 2 + pan.y])
    .scale(260 * zoom)
    .clipAngle(90)
    .precision(0.3)
    .rotate(rotation), [rotation, zoom, pan]);
  const path = geoPath(projection);
  const graticule = geoGraticule10();

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (pointers.current.size === 0) suppressClick.current = false;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size >= 2) {
      for (const pointerId of pointers.current.keys()) event.currentTarget.setPointerCapture(pointerId);
      const geometry = pinchGeometry();
      if (geometry) pinch.current = { ...geometry, zoom, pan };
      drag.current = null;
      suppressClick.current = true;
    } else if (!(event.target as Element).closest("a,button")) {
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { x: event.clientX, y: event.clientY, rotation };
    }
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size >= 2 && pinch.current) {
      const geometry = pinchGeometry();
      if (!geometry || !pinch.current.distance) return;
      const start = pinch.current;
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, start.zoom * geometry.distance / start.distance));
      const factor = nextZoom / start.zoom;
      setZoom(nextZoom);
      setPan({
        x: geometry.midpoint.x - SIZE / 2 - (start.midpoint.x - SIZE / 2 - start.pan.x) * factor,
        y: geometry.midpoint.y - SIZE / 2 - (start.midpoint.y - SIZE / 2 - start.pan.y) * factor,
      });
      return;
    }
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    setRotation([drag.current.rotation[0] + dx * 0.35, Math.max(-90, Math.min(90, drag.current.rotation[1] - dy * 0.35))]);
  }
  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    pinch.current = null;
    drag.current = null;
    if (pointers.current.size === 1) {
      const remaining = [...pointers.current.values()][0];
      drag.current = { ...remaining, rotation };
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function wheel(event: WheelEvent<HTMLDivElement>) {
    changeZoom(zoom * Math.exp(-event.deltaY * 0.001), svgPoint({ x: event.clientX, y: event.clientY }));
  }

  const centerX = SIZE / 2 + pan.x;
  const centerY = SIZE / 2 + pan.y;

  return <div className="ag-globe-stage" onWheel={wheel} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
    <svg ref={svgRef} className="ag-globe" viewBox={`0 0 ${SIZE} ${SIZE}`} role="group" aria-label="Interactive globe with green farmer markers. Drag to rotate or pinch anywhere to zoom.">
      <defs><clipPath id="ag-globe-clip"><circle cx={centerX} cy={centerY} r={260 * zoom} /></clipPath></defs>
      <circle className="ag-globe-ocean" cx={centerX} cy={centerY} r={260 * zoom} />
      <g clipPath="url(#ag-globe-clip)">
        <path className="ag-globe-grid" d={path(graticule) ?? ""} />
        {countries.features.map((country: any, index: number) => <path className="ag-globe-country" key={country.id ?? index} d={path(country) ?? ""} />)}
        {farmers.map((farmer, index) => {
          const location = farmerLocation(farmer, farmers.slice(0, index).filter((item) => item.country === farmer.country).length);
          if (!location) return null;
          const point = projection(location);
          if (!point) return null;
          const radians = Math.PI / 180;
          const centerLon = -rotation[0] * radians;
          const centerLat = -rotation[1] * radians;
          const lat = location[1] * radians;
          const lon = location[0] * radians;
          if (Math.sin(centerLat) * Math.sin(lat) + Math.cos(centerLat) * Math.cos(lat) * Math.cos(lon - centerLon) <= 0) return null;
          return <a key={farmer.id} href={profilePath(farmer.username)} aria-label={`View ${farmer.displayName}'s profile in ${farmer.country}`}>
            <circle className="ag-globe-marker-halo" cx={point[0]} cy={point[1]} r="14" />
            <circle className="ag-globe-marker" cx={point[0]} cy={point[1]} r="7" />
            <title>{farmer.displayName} · {farmer.country} · Open profile</title>
          </a>;
        })}
      </g>
      <circle className="ag-globe-outline" cx={centerX} cy={centerY} r={260 * zoom} />
    </svg>
    <div className="ag-globe-controls" aria-label="Globe controls">
      <button type="button" onClick={() => changeZoom(zoom * 1.25, { x: SIZE / 2, y: SIZE / 2 })} aria-label="Zoom in"><Plus size={18} /></button>
      <button type="button" onClick={() => changeZoom(zoom / 1.25, { x: SIZE / 2, y: SIZE / 2 })} aria-label="Zoom out"><Minus size={18} /></button>
      <button type="button" onClick={() => { setRotation([-18, -18]); setZoom(1); setPan({ x: 0, y: 0 }); }} aria-label="Reset globe view"><RotateCcw size={17} /></button>
    </div>
    <div className="ag-globe-hint">Drag to rotate · Pinch anywhere to zoom · Select a green marker to open a profile</div>
  </div>;
}
