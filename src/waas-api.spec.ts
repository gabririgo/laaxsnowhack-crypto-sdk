import {WaasApi} from "./waas-api";
import * as assert from "assert";
import {createSandbox} from "sinon";
import * as moxios from "moxios";

describe("WaasApi", function () {

    const CLIENT_ID = "1",
        CLIENT_SECRET = "2",
        SUBSCRIPTION = "3"
    ;
    beforeEach(function () {

        this.sandbox = createSandbox({
            useFakeServer: true,
        });

        moxios.install();
    });

    afterEach(function () {
        this.sandbox.restore();
        moxios.uninstall();
    });

    it("should construct an instance", function () {
        const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
        assert.ok(w instanceof WaasApi);
    });

    it("should throw on missing auth params", function () {
        this.sandbox.stub(process, "env").value({});
        assert.throws(() => new WaasApi(CLIENT_ID, "", ""));
    });

    describe("createWallet", function () {

        it("should respond with a new wallet", async function () {
            const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
            moxios.wait(() =>
                moxios.requests.mostRecent()
                    .respondWith({
                        status: 201,
                        // using example from the documentation
                        response: {
                            wallet: "ae5de2d7-6314-463e-a470-0a47812fcbec",
                            version: "e48c26c458c64c669cca3f6e46142698",
                            created: "2019-03-12T11:25:32Z",
                            updated: "2019-03-12T11:25:32Z",
                            security: "software",
                        },
                    }), 20);

            const {wallet} = (await w.createWallet("ae5de2d7-6314-463e-a470-0a47812fcbec")).data;
            assert.ok(wallet);
        });

        it("should fail due to missing wallet name", async function () {
            const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
            await assert.rejects(async () => w.createWallet(""));
        });

        it("should fail due to occupied wallet name", async function () {
            const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
            moxios.wait(() =>
                moxios.requests.mostRecent()
                    .respondWith({
                        status: 409,
                        // using example from the documentation
                        response: {
                            statusCode: 409,
                            activityId: "0b139d2a-b5ff-4f7f-a9d4-e802beaf4978",
                            message: "Won't overwrite existing wallet with name func-spec",
                        },
                    }), 20);

            try {
                await w.createWallet("ae5de2d7-6314-463e-a470-0a47812fcbec");
                assert.fail("should have thrown");
            } catch (e) {
                assert.ok(e instanceof Error);
            }
        });

    });

    describe("getWalletBalance", function () {
        // todo
    });

    describe("getWallet", function () {
        // todo
    });

    describe("getTokenBalance", function () {
        // todo
    });

    describe("deleteWallet", function () {
        // todo
    });

    describe("listWallets", function () {
        // todo
    });

});
