import { useEffect, useState } from 'react';
import { getMesas, crearTicket, getTicketAbiertoMesa } from '../api/endpoints';
import { useNavigate } from 'react-router-dom';

export default function Mesas(){
  const [mesas,setMesas]=useState<any[]>([]);
  const nav = useNavigate();

  useEffect(()=>{ getMesas().then(setMesas); },[]);

const abrir = async (mesaId:number) => {
  const abierto = await getTicketAbiertoMesa(mesaId);
  if (abierto.ticketId) {
    nav(`/ticket/${abierto.ticketId}`);
    return;
  }
  const { ticketId } = await crearTicket(mesaId);
  nav(`/ticket/${ticketId}`);
};

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Mesas</h2>
      <div className="grid grid-cols-4 gap-3">
        {mesas.map(m=>(
          <button key={m.id}
            onClick={()=>abrir(m.id)}
            className={`p-4 rounded-2xl border text-left ${m.estado!=='libre'?'bg-yellow-100':''}`}>
            <div className="font-semibold">{m.nombre}</div>
            <div className="text-sm text-gray-600">{m.estado} · {m.items_pendientes} ítems</div>
          </button>
        ))}
      </div>
    </div>
  );
}
