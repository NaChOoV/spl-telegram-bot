export type User = {
    imageUrl?: string;
};

export type AbmUser = {
    userId: string;
    run: string;
    firstName: string;
    lastName: string;
};

export enum State {
    ACTIVO = 1,
    INACTIVO = 0,
}

export enum AccessType {
    BIOMETRIA = 1,
    QR = 2,
}
