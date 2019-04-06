import {NotFoundError} from "./errors/not-found-error";
import {ConflictError} from "./errors/conflict-error";
import axios, {AxiosError, AxiosInstance, AxiosResponse} from "axios";
import {debug} from "debug";

/**
 * hard code software wallet usage for the hackathon
 */
const useHsm = false;

debug("laaxsnowhack-crypto-sdk:*");

enum WalletSecurity {
    SOFTWARE = "software",
    HSM = "hsm",
}

export enum WalletVersion {
    LATEST = "latest",
}

export enum KnownTokens {
    WT = "0xeC820c7Fadb1139f855477E626CaE5Efa304227d",
}

/**
 * represents a wallet
 */
interface IWallet {
    wallet: string;
    security: WalletSecurity;
    updated: string;
    created: string;
    version: string | WalletVersion.LATEST;
}

/**
 * represents a wallet list operation
 */
interface IWalletList {
    list: IWallet[];
    skiptoken: string;
}

/**
 * represents the Ethereum balance of a wallet
 */
interface IWalletBalance {
    address: string;
    balance: string;
    currency: string;
}

/**
 * represents a soft-deleted wallet
 */
interface ISoftDeletedWallet {
    recoveryId: string;
    scheduledPurgeDate: string;
}

/**
 * represents the ERC20 token balance of a wallet
 */
interface ITokenBalance {
    balance: string;
    currency: string;
}

/**
 * represents a wallet list operation
 */
interface ITransaction {
    hash: string;
}

async function catch404(e: AxiosError): Promise<AxiosResponse> {
    if (e.response && e.response.status === 404) {
        throw new NotFoundError("Wallet not found for given name");
    }
    throw e;
}

export class WaasApi {

    private readonly instance: AxiosInstance;

    /**
     * @param clientId - subscription client id
     * @param clientSecret - subscription client secret
     * @param subscription - subscription code
     */
    constructor(clientId: string, clientSecret: string, subscription: string) {

        if (!clientId) {
            throw new Error("missing variable clientId");
        }
        if (!clientSecret) {
            throw new Error("missing variable clientSecret");
        }
        if (!subscription) {
            throw new Error("missing variable subscription");
        }

        const api = {
            baseURL: "https://api.tangany.com/beta/",
            timeout: 20000,
            headers: {
                "tangany-client-id": clientId,
                "tangany-client-secret": clientSecret,
                "tangany-subscription": subscription,
                "common": {
                    Accept: "application/json",
                },
            },
            responseType: "json",
        };

        this.instance = axios.create(api);

        this.instance.interceptors.response.use((response: AxiosResponse) => {
            debug("interceptors.response");
            debug(response.toString());

            return response;
        }, async (e: AxiosError) => {
            if (e.response) {
                debug("interceptors.response.error");
                debug(`${e.response.status}`);
                debug(e.response.data);
            } else if (e.request) {
                debug("interceptors.request.error");
                debug(e.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                debug("interceptors.error");
                debug(e.message);
                debug(JSON.stringify(e.config));
            }

            throw e;
        });
    }

    /**
     * create a new wallet for given name
     * @param wallet - wallet name that can be linked to a user. E.g. the userId
     */
    public async createWallet(wallet: string): Promise<AxiosResponse<IWallet>> {
        if (!wallet) {
            throw new Error("missing wallet arg");
        }

        return this.instance
            .post("wallet", {
                wallet,
                useHsm,
            })
            .catch(e => {
                if (e.response && e.response.status === 409) {
                    throw new ConflictError("Cannot overwrite existing wallet");
                }
                throw e;
            })
            ;
    }

    /**
     * get ethereum balance and address for a wallet
     * @param wallet - wallet name
     */
    public async getWalletBalance(wallet: string): Promise<AxiosResponse<IWalletBalance>> {
        if (!wallet) {
            throw new Error("missing wallet arg");
        }

        return this.instance
            .get(`eth/wallet/${wallet}`)
            .catch(catch404)
            ;
    }

    /**
     * get wallet info for given name
     * @param wallet - wallet name
     */
    public async getWallet(wallet: string): Promise<AxiosResponse<IWallet>> {
        if (!wallet) {
            throw new Error("missing wallet arg");
        }

        return this.instance
            .get(`wallet/${wallet}`)
            .catch(catch404)
            ;
    }

    /**
     * get wallet info for given name
     * @param wallet - wallet name
     * @param tokenAddress - address of the ERC20 token contract
     */
    public async getTokenBalance(wallet: string, tokenAddress: string): Promise<AxiosResponse<ITokenBalance>> {
        if (!wallet) {
            throw new Error("missing wallet arg");
        }
        if (!tokenAddress) {
            throw new Error("missing tokenAddress arg");
        }

        return this.instance
            .get(`eth/erc20/${tokenAddress}/${wallet}`)
            .catch(catch404)
            ;
    }

    /**
     * soft deletes a wallet and makes it unaddressable via api. Restoring a soft-deleted wallet is currently only possible via service desk
     * @param wallet - wallet name
     */
    public async deleteWallet(wallet: string): Promise<AxiosResponse<ISoftDeletedWallet>> {
        if (!wallet) {
            throw new Error("missing wallet arg");
        }

        return this.instance
            .delete(`wallet/${wallet}`)
            .catch(catch404)
            ;
    }

    /**
     * retrieve a list of all wallets. Returns up to 25 wallets per query and a skiptoken if more wallets are available
     * @param skiptoken - skiptoken string returned in the api response to fetch the next batch of wallets
     */
    public async listWallets(skiptoken?: string): Promise<AxiosResponse<IWalletList>> {
        let url = "wallet";
        if (skiptoken) {
            url += `?skiptoken=${skiptoken}`;
        }

        return this.instance
            .get(url)
            ;
    }

    /**
     * send erc20 tokens to a recipient address
     * @param walletName - name of the wallet to send tokens from,
     * @param recipientAddress - ethereum address of the token recipient. Not to confuse with the token address,
     * @param tokenAddress - ethereum contract address of the erc20 token.
     * @param amount - float amount of tokens formatted as string
     */
    public async sendToken(walletName: string, recipientAddress: string, tokenAddress: KnownTokens | string, amount: string): Promise<AxiosResponse<ITransaction>> {
        return this.instance
            .post(`eth/erc20/${tokenAddress}/${walletName}/send`, {
                to: recipientAddress,
                amount,
            })
            ;
    }

    /**
     * mint a few tokens to the wallet address
     * @param walletName - name of the wallet to send tokens from,
     * @param tokenAddress - ethereum contract address of the erc20 token.
     * @param amount - float amount of tokens formatted as string
     */
    public async mintToken(walletName: string, tokenAddress: KnownTokens | string, amount: string): Promise<AxiosResponse<ITransaction>> {
        return this.instance
            .post(`eth/erc20/${tokenAddress}/${walletName}/mint`, {
                amount,
            })
            ;
    }

    /**
     * approve token withdrawal to given address
     * @param walletName - name of the wallet to send tokens from,
     * @param tokenAddress - ethereum contract address of the erc20 token.
     * @param to - address that may withdraw the approved amount of tokens from wallet
     * @param amount - float amount of tokens formatted as string
     */
    public async approve(walletName: string, tokenAddress: KnownTokens | string, to: string, amount: string): Promise<AxiosResponse<ITransaction>> {
        return this.instance
            .post(`eth/erc20/${tokenAddress}/${walletName}/approve`, {
                to,
                amount,
            })
            ;
    }
}
