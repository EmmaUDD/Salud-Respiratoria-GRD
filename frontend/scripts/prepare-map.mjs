// Build a local, simplified SVG geometry from the attributed reference GeoJSON.
import fs from 'node:fs';
const geo = JSON.parse(fs.readFileSync(new URL('../src/assets/chile-regions-source.json', import.meta.url)));
function simplify(points, tolerance = .18) {
  if (points.length <= 2) return points;
  const a = points[0], b = points.at(-1), dx = b[0] - a[0], dy = b[1] - a[1];
  let max = 0, index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i], t = Math.max(0, Math.min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy || 1)));
    const d = Math.hypot(p[0]-a[0]-t*dx, p[1]-a[1]-t*dy);
    if (d > max) { max = d; index = i; }
  }
  return max > tolerance ? [...simplify(points.slice(0,index+1), tolerance).slice(0,-1), ...simplify(points.slice(index), tolerance)] : [a,b];
}
const path = (rings, project) => rings.map(r => {
  const points = simplify(r.map(project));
  return points.length < 4 ? '' : points.map((p,i) => `${i?'L':'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('')+'Z';
}).join('');
const regions = geo.features.map(f => {
  const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  return { id: String(f.properties.codregion).padStart(2,'0'), d: polygons.filter(p => p[0][0][0] > -78).map(p => path(p, ([x,y]) => [25+(x+76)*13.6, 12+(-17.4-y)*17])).join('') };
});
const valpo = geo.features.find(f => f.properties.codregion === 5).geometry.coordinates;
const insets = [{ label:'Rapa Nui', polygons:valpo.filter(p=>p[0][0][0]<-100) }, { label:'Juan Fernández', polygons:valpo.filter(p=>p[0][0][0]>-85 && p[0][0][0]<-78) }].map(({label,polygons})=> {
  const pts=polygons.flat(2), xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  const minX=Math.min(...xs), maxY=Math.max(...ys), scale=Math.min(100/(Math.max(...xs)-minX),45/(maxY-Math.min(...ys)));
  return {label,d:polygons.map(p=>path(p,([x,y])=>[10+(x-minX)*scale,10+(maxY-y)*scale])).join('')};
});
fs.writeFileSync(new URL('../src/assets/chile-map.json',import.meta.url),JSON.stringify({regions,insets}));
console.log(`Prepared ${regions.length} regions and ${insets.length} island insets.`);
