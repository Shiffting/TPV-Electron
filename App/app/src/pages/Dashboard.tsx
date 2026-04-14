import { useEffect, useState } from 'react';
import { getKpis } from '../api/endpoints';

export default function Dashboard(){
  const [k,setK]=useState<any>(null);
  useEffect(()=>{ getKpis().then(setK); },[]);
  if(!k) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">KPIs</h2>
      <div className="grid grid-cols-3 gap-4">
        <Card title="Ventas hoy" value={k.hoy.ventas.toFixed(2)+' €'}/>
        <Card title="Tickets hoy" value={k.hoy.tickets}/>
        <Card title="Ticket medio" value={k.hoy.ticketMedio.toFixed(2)+' €'}/>
      </div>
      <div>
        <h3 className="font-semibold mt-6 mb-2">Top productos (7d)</h3>
        <ul className="list-disc ml-6">
          {k.topProductos.map((p:any)=>(
            <li key={p.nombre_producto}>{p.nombre_producto} — {p.total.toFixed(2)} € ({p.uds})</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Card({title,value}:{title:string;value:any}){
  return <div className="p-4 rounded-2xl bg-white shadow"><div className="text-sm text-gray-600">{title}</div><div className="text-2xl font-bold">{value}</div></div>;
}
