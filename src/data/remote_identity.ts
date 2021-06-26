/**
 *
 * 2key-ratchet
 * Copyright (c) 2016 Peculiar Ventures, Inc
 * Based on https://whispersystems.org/docs/specifications/doubleratchet/ and
 * https://whispersystems.org/docs/specifications/x3dh/ by Open Whisper Systems
 *
 */

import { Curve, ECPublicKey } from "../crypto";
import { IdentityProtocol } from "../protocol";
import { IJsonSerializable } from "../type";

export interface IJsonRemoteIdentity {
    id: string;
    /**
     * Thumbprint of signing key
     *
     * @type {string}
     * @memberOf IJsonRemoteIdentity
     */
    thumbprint: string;
    signingKey: CryptoKey;
    exchangeKey: CryptoKey;
    signature: ArrayBuffer;
    createdAt: string;
}

export class RemoteIdentity implements IJsonSerializable {

    public static fill(protocol: IdentityProtocol) {
        const res = new RemoteIdentity();
        res.fill(protocol);
        return res;
    }

    public static async fromJSON(obj: IJsonRemoteIdentity) {
        const res = new this();
        await res.fromJSON(obj);
        return res;
    }

    public id: string;
    public signingKey: ECPublicKey;
    public exchangeKey: ECPublicKey;
    public signature: ArrayBuffer;
    public createdAt: Date;

    public fill(protocol: IdentityProtocol) {
        this.signingKey = protocol.signingKey;
        this.exchangeKey = protocol.exchangeKey;
        this.signature = protocol.signature;
        this.createdAt = protocol.createdAt;
    }

    public verify() {
        return Curve.verify(this.signingKey, this.exchangeKey.serialize(), this.signature);
    }

    public async toJSON() {
        return {
            createdAt: this.createdAt.toISOString(),
            exchangeKey: await this.exchangeKey.key,
            id: this.id,
            signature: this.signature,
            signingKey: await this.signingKey.key,
            thumbprint: await this.signingKey.thumbprint(),
        } as IJsonRemoteIdentity;
    }

    public async fromJSON(obj: IJsonRemoteIdentity) {
        this.id = obj.id;
        this.signature = obj.signature;
        this.signingKey = await ECPublicKey.create(obj.signingKey);
        this.exchangeKey = await ECPublicKey.create(obj.exchangeKey);
        this.createdAt = new Date(obj.createdAt);

        // verify signature
        const ok = await this.verify();
        if (!ok) {
            throw new Error("Error: Wrong signature for RemoteIdentity");
        }
    }
}
