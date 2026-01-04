import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Socket connects to API server (without /api path)
const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:3001";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected");
      setConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return { socket: socketRef.current, connected };
}

export function useDeploymentUpdates(
  deploymentId: string,
  onUpdate: (data: any) => void
) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !deploymentId) return;

    socket.emit("subscribe-deployment", deploymentId);

    socket.on("deployment-update", onUpdate);

    return () => {
      socket.off("deployment-update", onUpdate);
      socket.emit("unsubscribe-deployment", deploymentId);
    };
  }, [socket, deploymentId]);
}

export function useDeploymentLogs(
  deploymentId: string,
  onLog: (log: string) => void
) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !deploymentId) return;

    // Subscribe to deployment updates
    socket.emit("subscribe-deployment", deploymentId);

    const handleLog = (data: { deploymentId: string; log: string }) => {
      console.log("Received log:", data);
      onLog(data.log);
    };

    socket.on("deployment-log", handleLog);

    return () => {
      socket.off("deployment-log", handleLog);
      socket.emit("unsubscribe-deployment", deploymentId);
    };
  }, [socket, deploymentId, onLog]);
}
