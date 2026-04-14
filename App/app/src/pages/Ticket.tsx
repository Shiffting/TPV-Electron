import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTicket, addLinea, pagarParcial } from '../api/endpoints';

export default function Ticket(){
  const { id } = useParams();
  const ticketId = Number(id);
  const [data,setData]=useState<any>(null);
  const [nombre,setNombre]=useState('Café con leche');
  const [pvp,setPvp]=useState(1.5);

  const load=()=>getTicket(ticketId).then(setData);
  useEffect(()=>{ load(); },[ticketId]);

  const add=async ()=>{
    await addLinea(ticketId,{ nombreProducto:nombre, pvp, cantidad:1, propiedades:[] });
    load();
  };

  const cobrarPrimera=async ()=>{
    if(!data?.lineas?.length) return;
    const lineaId = data.lineas[0].id;
    await pagarParcial(ticketId,{ lineasIds:[lineaId], metodoCodigo:'efectivo', importe:data.lineas[0].total_linea });
    load();
  };

  if(!data) return null;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Ticket #{ticketId} · estado {data.ticket.estado}</h2>

      <div className="flex gap-2">
        <input className="border p-2 rounded" value={nombre} onChange={e=>setNombre(e.target.value)} />
        <input type="number" step="0.01" className="border p-2 rounded w-28" value={pvp} onChange={e=>setPvp(+e.target.value)} />
        <button onClick={add} className="px-3 py-2 rounded bg-black text-white">Añadir</button>
        <button onClick={cobrarPrimera} className="px-3 py-2 rounded bg-emerald-600 text-white">Cobrar 1ª línea</button>
      </div>

      <table className="w-full text-sm">
        <thead><tr className="text-left border-b"><th>Producto</th><th>Cant</th><th>PVP</th><th>Total</th><th>Estado</th></tr></thead>
        <tbody>
          {data.lineas.map((l:any)=>(
            <tr key={l.id} className="border-b">
              <td>{l.nombre_producto}</td><td>{l.cantidad}</td><td>{l.pvp.toFixed(2)}</td><td>{l.total_linea.toFixed(2)}</td><td>{l.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
