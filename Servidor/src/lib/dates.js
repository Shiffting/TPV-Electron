export function rangeFromQuery(q){
  const from = q.from ? q.from+' 00:00:00' : new Date().toISOString().slice(0,10)+' 00:00:00';
  const to   = q.to   ? q.to+' 23:59:59'  : new Date().toISOString().slice(0,10)+' 23:59:59';
  return { from, to };
}
