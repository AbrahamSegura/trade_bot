import { _balance } from "./balance.js"

export const _updateBalances = async ({ MARKET1, MARKET2, store }) => {
    const balance = await _balance()
    const key = market => market.toLowerCase() + '_balance'
    const value = market => fl(balance[market].available)
    store.put(key(MARKET1), value(MARKET1))
    store.put(key(MARKET2), value(MARKET2))
}