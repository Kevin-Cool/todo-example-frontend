import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { API_BASE_URL } from "../config/apiConfig";

export type ToDoHub = {
    connection: HubConnection;
    start: () => Promise<void>;
    stop: () => Promise<void>;
};

export function createToDoHub(userId: string): ToDoHub {
    const queryString: string = `userId=${encodeURIComponent(userId)}`;
    const url: string = `${API_BASE_URL}/api/hubs/todos?${queryString}`;

    const connection: HubConnection =
        new HubConnectionBuilder()
            .withUrl(url, {
                withCredentials: false
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

    async function start(): Promise<void> {
        if (connection.state === HubConnectionState.Disconnected) {
            await connection.start();
        }
    }

    async function stop(): Promise<void> {
        if (connection.state !== HubConnectionState.Disconnected) {
            await connection.stop();
        }
    }

    return { connection, start, stop };
}