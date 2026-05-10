import { io } from "socket.io-client";

console.count("SOCKET CREATED");

export const socket = io("http://localhost:8080");