import { useMemo } from "react";
import { roads, buildings, landmarks } from "../data/campus";
import { BOUNDS } from "../lib/geo";
import { useSim, sim } from "../lib/store";
import { Maximize2, ArrowUpRight, X } from "lucide-react";
const width = BOUNDS.maxX - BOUNDS.minX,
  height = BOUNDS.maxZ - BOUNDS.minZ;
export function Minimap({ expanded = false }: { expanded?: boolean }) {
  const s = useSim();
  const map = useMemo(
    () => ({
      roads: roads.map((r) => ({
        id: r.id,
        width: r.width,
        points: r.points.map((p) => p.join(",")).join(" "),
      })),
      buildings: buildings.map((b) => ({
        id: b.id,
        points: b.points.map((p) => p.join(",")).join(" "),
      })),
    }),
    [],
  );
  return (
    <section
      className={expanded ? "map-expanded" : "minimap"}
      aria-label="Campus minimap"
    >
      <div className="map-heading">
        <span>
          USF TAMPA <span className="map-secondary">/ CAMPUS MAP</span>
        </span>
        <button
          aria-label={expanded ? "Close map" : "Expand map"}
          onClick={() => sim.set({ mapOpen: !expanded })}
        >
          {expanded ? <X size={17} /> : <Maximize2 size={15} />}
        </button>
      </div>
      <svg
        viewBox={`${BOUNDS.minX - 70} ${BOUNDS.minZ - 70} ${width + 140} ${height + 140}`}
        role="img"
        aria-label="North-up campus map with your vehicle and landmark locations"
      >
        <rect
          x={BOUNDS.minX}
          y={BOUNDS.minZ}
          width={width}
          height={height}
          rx="25"
          fill="#dce4d6"
        />
        {map.buildings.map((b) => (
          <polygon key={b.id} points={b.points} fill="#b5c2ad" />
        ))}
        {map.roads.map((r) => (
          <polyline
            key={r.id}
            points={r.points}
            fill="none"
            stroke="#fcfcf5"
            strokeWidth={r.width + 3}
            strokeLinejoin="round"
          />
        ))}
        {landmarks.map((l, i) => (
          <g
            key={l.id}
            transform={`translate(${l.position.x},${l.position.z})`}
          >
            <circle
              r={expanded ? 22 : 30}
              fill={s.destination === l.id ? "#b49752" : "#386b57"}
              stroke="#fff"
              strokeWidth="6"
            />
            {expanded && (
              <text y="-35" textAnchor="middle" fill="#153a2e" fontSize="28">
                {l.name}
              </text>
            )}
          </g>
        ))}
        <g>
          <path
            d={`M${BOUNDS.minX + 100} ${BOUNDS.maxZ + 30}h200`}
            stroke="#386b57"
            strokeWidth="6"
          />
          <text
            x={BOUNDS.minX + 320}
            y={BOUNDS.maxZ + 40}
            fontSize="30"
            fill="#386b57"
          >
            200 m
          </text>
        </g>
        <g
          transform={`translate(${s.x},${s.z}) rotate(${(s.heading * 180) / Math.PI})`}
        >
          <circle r="58" fill="#006747" opacity=".13" />
          <path
            d="M0 -40 27 27 0 15 -27 27Z"
            fill="#006747"
            stroke="white"
            strokeWidth="8"
          />
        </g>
      </svg>
      <span className="north">N ↑</span>
      <div className="map-footer">
        <span>
          <i /> You are here
        </span>
        <span>North-up</span>
      </div>
    </section>
  );
}
