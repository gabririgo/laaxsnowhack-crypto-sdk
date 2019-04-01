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

enum WalletVersion {
    LATEST = "latest",
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

async function catch404(e: AxiosError): Promise<AxiosResponse> {
    if (e.response && e.response.status === 404) {
        throw new NotFoundError("Wallet not found for given name");
    }
    throw e;
}

export class WaasApi {

    private readonly instance: AxiosInstance;

    constructor() {

        const env = {
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            subscription: process.env.SUBSCRIPTION,
        };

        if (!env.clientId) {
            throw new Error("missing environment variable CLIENT_ID");
        }
        if (!env.clientSecret) {
            throw new Error("missing environment variable CLIENT_SECRET");
        }
        if (!env.subscription) {
            throw new Error("missing environment variable SUBSCRIPTION");
        }

        this.instance = axios.create({
            baseURL: "https://api.tangany.com/v1/",
            timeout: 20000,
            headers: {
                "tangany-client-id": env.clientId,
                "tangany-client-secret": env.clientSecret,
                "tangany-subscription": env.subscription,
                "common": {
                    Accept: "application/json",
                },
            },
            responseType: "json",
        });

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

}
