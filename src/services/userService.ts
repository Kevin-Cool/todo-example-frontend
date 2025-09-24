import { httpRequestJson } from "./httpClient";

export interface UserDTO {
    id: string;
    email: string;
    surname: string;
    name: string;
    archived: boolean;
}

export interface UserCreateDTO {
    email: string;
    password: string;
    permissions: number;
    surname: string;
    name: string;
}

export interface UserUpdateDTO {
    email?: string;
    password?: string;
    permissions?: number;
    surname?: string;
    name?: string;
}

const BASE_PATH: string = "/api/users";

// CREATE
export async function createUser(model: UserCreateDTO): Promise<UserDTO> {
    return await httpRequestJson<UserDTO>({
        method: "POST",
        path: `${BASE_PATH}`,
        body: model
    });
}

// GET
export async function getUserById(userID: string): Promise<UserDTO> {
    return await httpRequestJson<UserDTO>({
        method: "GET",
        path: `${BASE_PATH}/${encodeURIComponent(userID)}`
    });
}

export async function getAllUsers(): Promise<UserDTO[]> {
    return await httpRequestJson<UserDTO[]>({
        method: "GET",
        path: `${BASE_PATH}`
    });
}

// UPDATE
export async function updateUser(userID: string, model: UserUpdateDTO): Promise<UserDTO> {
    return await httpRequestJson<UserDTO>({
        method: "PUT",
        path: `${BASE_PATH}/${encodeURIComponent(userID)}`,
        body: model
    });
}

// DELETE
export async function deleteUser(userID: string): Promise<void> {
    await httpRequestJson<void>({
        method: "DELETE",
        path: `${BASE_PATH}/${encodeURIComponent(userID)}`
    });
}
