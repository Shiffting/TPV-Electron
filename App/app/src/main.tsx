import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import Login from './pages/Login';
import Mesas from './pages/Mesas';
import Ticket from './pages/Ticket';
import Dashboard from './pages/Dashboard';
import Shell from './shell/Shell';

const router = createBrowserRouter([
  { path: '/', element: <Shell/>, children: [
    { index: true, element: <Dashboard/> },
    { path: 'mesas', element: <Mesas/> },
    { path: 'ticket/:id', element: <Ticket/> },
  ]},
  { path: '/login', element: <Login/> }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><RouterProvider router={router}/></React.StrictMode>
);
