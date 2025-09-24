import { httpRequestJson } from "./httpClient";

export interface UserDTO {
    id: string;
    email: string;
    surname: string;
    name: string;
    archived: boolean;
}

export interface ToDoDTO {
    id: string;
    title: string | null;
    description: string | null;
    creatingUser: UserDTO;
    taggedUsers: UserDTO[];
    creationDate: string;
    archived: boolean;
}

export interface ToDoCreateDTO {
    title?: string | null;
    description?: string | null;
    taggedUsers?: string[]; // Guid[]
}

export interface ToDoUpdateDTO {
    title?: string | null;
    description?: string | null;
    taggedUsers?: string[]; // Guid[]
}

const BASE_PATH: string = "/api/todo";

// CREATE
export async function createToDo(model: ToDoCreateDTO): Promise<ToDoDTO> {
    return await httpRequestJson<ToDoDTO>({
        method: "POST",
        path: `${BASE_PATH}`,
        body: model
    });
}

// GET
export async function getToDoById(toDoID: string): Promise<ToDoDTO> {
    return await httpRequestJson<ToDoDTO>({
        method: "GET",
        path: `${BASE_PATH}/${encodeURIComponent(toDoID)}`
    });
}

export async function getAllToDos(): Promise<ToDoDTO[]> {
    return await httpRequestJson<ToDoDTO[]>({
        method: "GET",
        path: `${BASE_PATH}`
    });
}
export async function getToDosByUser(userID?: string): Promise<ToDoDTO[]> {
    const basePath: string = "/api/todo/user";
    const path: string = userID !== undefined && userID.trim().length > 0
        ? `${basePath}/${encodeURIComponent(userID)}`
        : basePath;

    const result: ToDoDTO[] = await httpRequestJson<ToDoDTO[]>({
        method: "GET",
        path: path
    });
    return result;
}

// UPDATE
export async function updateToDo(toDoID: string, model: ToDoUpdateDTO): Promise<ToDoDTO> {
    return await httpRequestJson<ToDoDTO>({
        method: "PUT",
        path: `${BASE_PATH}/${encodeURIComponent(toDoID)}`,
        body: model
    });
}

// DELETE
export async function deleteToDo(toDoID: string): Promise<void> {
    await httpRequestJson<void>({
        method: "DELETE",
        path: `${BASE_PATH}/${encodeURIComponent(toDoID)}`
    });
}
