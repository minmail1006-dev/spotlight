import {
  AttributionControl,
  GeolocateControl,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useNow, usePlans, useVenues } from '../lib/hooks'
import { logEvent } from '../lib/log'
import { formatWhen, planPhase } from '../lib/time'
import type { Plan, Venue } from '../lib/types'

// The map library runs a background worker; tell it where Vite put the file.
setWorkerUrl(new URL(workerUrl, window.location.href).href)

// Free OpenStreetMap-based map with 3D buildings, no account or API key needed.
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const COPENHAGEN: [number, number] = [12.5655, 55.6795]
const VIEW_3D = { pitch: 55, bearing: -17 }
const ALL = 'All of Copenhagen'

type Located = Venue & { lat: number; lng: number }

export default function MapPage() {
  const { venues } = useVenues()
  const { plans } = usePlans()
  const now = useNow()
  const [params, setParams] = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Record<string, { marker: Marker; el: HTMLButtonElement }>>({})
  const fittedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [is3d, setIs3d] = useState(true)
  const [area, setArea] = useState(ALL)
  const selectedSlug = params.get('venue')

  const located = useMemo(() => venues.filter((v): v is Located => v.lat != null && v.lng != null), [venues])
  const areas = useMemo(() => [ALL, ...[...new Set(located.map((v) => v.neighborhood))].sort()], [located])
  const openPlans = useMemo(() => plans.filter((p) => planPhase(p, now) !== 'ended'), [plans, now])
  const plansByVenue = useMemo(() => {
    const m: Record<string, Plan[]> = {}
    for (const p of openPlans) (m[p.venue_id] ??= []).push(p)
    return m
  }, [openPlans])
  const selected = located.find((v) => v.slug === selectedSlug) ?? null

  // Create the map once
  useEffect(() => {
    if (!containerRef.current) return
    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      center: COPENHAGEN,
      zoom: 13.6,
      ...VIEW_3D,
      maxPitch: 70,
      attributionControl: false,
    })
    map.addControl(new AttributionControl({ compact: true }), 'bottom-left')
    map.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-right')
    map.addControl(new GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), 'bottom-right')
    map.on('load', () => {
      // Show 3D buildings one zoom level earlier than the default style does
      if (map.getLayer('building-3d')) map.setLayerZoomRange('building-3d', 13, 24)
      setReady(true)
    })
    mapRef.current = map
    logEvent('view_map')
    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = {}
      fittedRef.current = false
    }
  }, [])

  // Add one marker per venue (pin with emoji, discount and open-plan count)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    for (const v of located) {
      if (markersRef.current[v.slug]) continue
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'map-pin'
      el.setAttribute('aria-label', v.name)
      el.style.setProperty('--pin', v.color)
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setParams({ venue: v.slug }, { replace: true })
      })
      const marker = new Marker({ element: el, anchor: 'bottom' }).setLngLat([v.lng, v.lat]).addTo(map)
      markersRef.current[v.slug] = { marker, el }
    }
    // First time: frame all venues (unless a specific venue was asked for)
    if (!fittedRef.current && located.length > 0) {
      fittedRef.current = true
      if (!selectedSlug) {
        const bounds = new LngLatBounds()
        located.forEach((v) => bounds.extend([v.lng, v.lat]))
        map.fitBounds(bounds, { padding: { top: 130, bottom: 90, left: 40, right: 40 }, maxZoom: 15, ...VIEW_3D, duration: 0 })
      }
    }
    const onMapClick = () => setParams({}, { replace: true })
    map.on('click', onMapClick)
    return () => {
      map.off('click', onMapClick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [located, ready, setParams])

  // Keep pin contents up to date (open plans change live)
  useEffect(() => {
    for (const v of located) {
      const entry = markersRef.current[v.slug]
      if (!entry) continue
      const count = plansByVenue[v.id]?.length ?? 0
      entry.el.innerHTML = `<span class="map-pin-bubble"><span class="map-pin-emoji">${v.emoji}</span>${
        count > 0 ? `<span class="map-pin-count">${count}</span>` : ''
      }</span><span class="map-pin-label">−${v.discount_pct}%</span>`
      entry.el.classList.toggle('is-selected', v.slug === selectedSlug)
      entry.el.classList.toggle('is-quiet', count === 0)
    }
  }, [located, plansByVenue, selectedSlug, ready])

  // Fly to the selected venue
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !selected) return
    map.flyTo({
      center: [selected.lng, selected.lat],
      zoom: Math.max(map.getZoom(), 15.5),
      ...(is3d ? VIEW_3D : { pitch: 0, bearing: 0 }),
      padding: { top: 120, bottom: 260, left: 0, right: 0 },
      duration: 1200,
    })
    logEvent('map_select_venue', { venue_id: selected.id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.slug, ready])

  function showArea(name: string) {
    setArea(name)
    const map = mapRef.current
    if (!map) return
    const pts = located.filter((v) => name === ALL || v.neighborhood === name)
    if (pts.length === 0) return
    const bounds = new LngLatBounds()
    pts.forEach((v) => bounds.extend([v.lng, v.lat]))
    map.fitBounds(bounds, {
      padding: { top: 140, bottom: 120, left: 50, right: 50 },
      maxZoom: 15.5,
      ...(is3d ? VIEW_3D : { pitch: 0, bearing: 0 }),
      duration: 1200,
    })
    setParams({}, { replace: true })
    logEvent('map_area', { meta: { area: name } })
  }

  function toggle3d() {
    const next = !is3d
    setIs3d(next)
    mapRef.current?.easeTo({ ...(next ? VIEW_3D : { pitch: 0, bearing: 0 }), duration: 800 })
  }

  const selectedPlans = selected ? plansByVenue[selected.id] ?? [] : []

  return (
    <div className="map-page">
      <div ref={containerRef} className="map-canvas" />

      <div className="map-top">
        <div className="map-title-row">
          <h1 className="map-title">Map</h1>
          <button className="map-toggle" onClick={toggle3d} aria-pressed={is3d}>
            {is3d ? '2D' : '3D'}
          </button>
        </div>
        <div className="chips map-chips" role="group" aria-label="Neighbourhood">
          {areas.map((a) => (
            <button key={a} className={`chip${area === a ? ' on' : ''}`} onClick={() => showArea(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {!ready && <div className="map-loading">Loading map…</div>}

      {selected && (
        <div className="map-card" role="dialog" aria-label={selected.name}>
          <button className="map-card-close" onClick={() => setParams({}, { replace: true })} aria-label="Close">
            ×
          </button>
          <div className="map-card-head">
            <span className="map-card-emoji" style={{ background: selected.color }} aria-hidden>
              {selected.emoji}
            </span>
            <div>
              <h2>{selected.name}</h2>
              <p className="muted small">
                {selected.category} · {selected.neighborhood}
              </p>
            </div>
            <span className="discount-chip">−{selected.discount_pct}%</span>
          </div>
          <p className="small map-card-offer">{selected.offer}</p>
          {selectedPlans.length === 0 ? (
            <p className="muted small">No open plans here yet. Be the first!</p>
          ) : (
            <ul className="map-card-plans">
              {selectedPlans.slice(0, 3).map((p) => (
                <li key={p.id}>
                  <Link to={`/plan/${p.id}`}>
                    <span className={`when when-${planPhase(p, now)}`}>
                      {planPhase(p, now) === 'live' ? 'Now' : formatWhen(p.starts_at)}
                    </span>
                    <span className="map-card-plan-title">{p.title}</span>
                    <span className="muted small">{p.rsvps.length} going</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="row">
            <Link to={`/venue/${selected.slug}`} className="btn btn-ghost btn-small">Venue page</Link>
            <Link to={`/new?venue=${selected.slug}`} className="btn btn-primary btn-small">Post a plan here</Link>
          </div>
        </div>
      )}
    </div>
  )
}
