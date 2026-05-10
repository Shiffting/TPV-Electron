import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/index.css'
import Login from './pages/Login';
import Mesas from './pages/Mesas';
import Ticket from './pages/Ticket';
import Dashboard from './pages/Dashboard';
import Shell from './shell/Shell';
import Cocina from "./pages/Cocina";

const router = createBrowserRouter([
  { path: '/', element: <Shell/>, children: [
    { index: true, element: <Dashboard/> },
    { path: 'mesas', element: <Mesas/> },
    { path: 'ticket/:id', element: <Ticket/> },
    { path: 'cocina', element: <Cocina/> },
  ]},
  { path: '/login', element: <Login/> }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router}/>
);
