import {TransactionBuilder} from "../TransactionBuilder";
import {Transaction} from "../generated/Transaction_pb";
import {TransactionResponse} from "../generated/TransactionResponse_pb";
import {grpc} from "@improbable-eng/grpc-web";
import {CryptoCreateTransactionBody} from "../generated/CryptoCreate_pb";
import {BaseClient} from "../BaseClient";
import {newDuration, tinybarToString} from "../util";
import {PublicKey} from "../Keys";
import BigNumber from "bignumber.js";
import {CryptoService} from "../generated/CryptoService_pb_service";
import {Hbar} from "../Hbar";
import {Tinybar} from "../typedefs";
import UnaryMethodDefinition = grpc.UnaryMethodDefinition;

export class AccountCreateTransaction extends TransactionBuilder {
    private body: CryptoCreateTransactionBody;

    constructor(client: BaseClient) {
        super(client);
        const body = new CryptoCreateTransactionBody();
        this.body = body;
        this.inner.setCryptocreateaccount(body);

        // 90 days, required
        this.setAutoRenewPeriod(7890000);
        // Default to maximum values for record thresholds. Without this records would be
        // auto-created whenever a send or receive transaction takes place for this new account.
        // This should be an explicit ask.
        this.setReceiveRecordThreshold(Hbar.MAX_VALUE);
        this.setSendRecordThreshold(Hbar.MAX_VALUE);
    }

    setKey(publicKey: PublicKey): this {
        this.body.setKey(publicKey.toProtoKey());
        return this;
    }

    setAutoRenewPeriod(seconds: number): this {
        this.body.setAutorenewperiod(newDuration(seconds));
        return this;
    }

    setInitialBalance(balance: Tinybar | Hbar): this {
        this.body.setInitialbalance(tinybarToString(balance));
        return this;
    }

    setReceiveRecordThreshold(threshold: Tinybar | Hbar): this {
        this.body.setReceiverecordthreshold(tinybarToString(threshold));
        return this;
    }

    setSendRecordThreshold(threshold: Tinybar | Hbar): this {
        this.body.setSendrecordthreshold(tinybarToString(threshold));
        return this;
    }

    get method(): UnaryMethodDefinition<Transaction, TransactionResponse> {
        return CryptoService.createAccount;
    }

    doValidate(errors: string[]): void {
        if (!this.body.hasKey()) {
            errors.push('AccountCreateTransaction requires setKey()');
        }

        if (new BigNumber(this.body.getInitialbalance()).isZero()) {
            errors.push('AccountCreateTransaction must have nonzero setInitialBalance')
        }
    }
}
