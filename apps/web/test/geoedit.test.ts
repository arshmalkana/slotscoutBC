import { describe, expect, it } from "vitest";
import { addShape, bufferLine, circleAt, deleteVertex, draftStats, fromGeometry, handles, insertVertex, moveVertex, ringPolygon, subtractShape, toGeometry } from "../src/lib/geoedit";

const square = (x: number, y: number, s: number) => ringPolygon([
  [x, y],
  [x + s, y],
  [x + s, y + s],
  [x, y + s],
])!;

describe("map editor geometry", () => {
  it("moves a ring's first corner together with its closing corner", () => {
    const d = fromGeometry(square(-122, 49, 0.01));
    const m = moveVertex(d, [0, 0, 0], [-122.005, 48.995]);
    const ring = m[0]![0]!;
    expect(ring[0]).toEqual([-122.005, 48.995]);
    expect(ring[ring.length - 1]).toEqual([-122.005, 48.995]);
    expect(d[0]![0]![0]).toEqual([-122, 49]);
  });

  it("adds and removes corners, and drops a ring left with too few", () => {
    const d = fromGeometry(square(-122, 49, 0.01));
    const more = insertVertex(d, [0, 0, 0], [-121.995, 48.998]);
    expect(more[0]![0]!.length).toBe(6);
    let less = deleteVertex(more, [0, 0, 1]);
    expect(less[0]![0]!.length).toBe(5);
    less = deleteVertex(deleteVertex(less, [0, 0, 0]), [0, 0, 0]);
    expect(less).toEqual([]);
  });

  it("joins overlapping shapes and cuts holes", () => {
    let d = addShape([], square(-122, 49, 0.01));
    d = addShape(d, square(-121.995, 49, 0.01));
    expect(d.length).toBe(1);
    const before = draftStats(d).km2;
    d = subtractShape(d, square(-121.996, 49.002, 0.002));
    expect(draftStats(d).km2).toBeLessThan(before);
    expect(toGeometry(d)?.type).toBe("Polygon");
  });

  it("buffers a line and draws a circle of the right size", () => {
    const b = bufferLine([
      [-122, 49],
      [-122, 49.01],
    ], 100)!;
    const km2 = draftStats(fromGeometry(b)).km2;
    expect(km2).toBeGreaterThan(0.2);
    expect(km2).toBeLessThan(0.26);
    const c = draftStats(fromGeometry(circleAt([-122, 49], 1000))).km2;
    expect(c).toBeGreaterThan(3.1);
    expect(c).toBeLessThan(3.15);
  });

  it("counts self-crossings and gives a handle for every corner and side", () => {
    const bow = { type: "Polygon" as const, coordinates: [[[-122, 49], [-121.99, 49.01], [-121.99, 49], [-122, 49.01], [-122, 49]]] };
    expect(draftStats(fromGeometry(bow)).crossings).toBeGreaterThan(0);
    const h = handles(fromGeometry(square(-122, 49, 0.01)));
    expect(h.vertices.features.length).toBe(4);
    expect(h.midpoints.features.length).toBe(4);
  });
});
