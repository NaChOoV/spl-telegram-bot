export type User = {
    imageUrl?: string;
};

export enum State {
    ACTIVO = 1,
    INACTIVO = 0,
}

export enum AccessType {
    BIOMETRIA = 1,
    QR = 2,
}
