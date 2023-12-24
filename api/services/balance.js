import { client } from "../utils/binance.js";

export const _balance = async () => {
    await client.useServerTime()
    return await client.balance()
}