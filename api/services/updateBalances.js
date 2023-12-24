export const _updateBalances = async ({ MARKET1, MARKET2, store }) => {
    const balance = await _balance()
    const key1 = MARKET1.toLowerCase() + '_balance'
    const value1 = fl(balance[MARKET1].available)
    const key2 = MARKET2.toLowerCase() + '_balance'
    const value2 = fl(balance[MARKET2].available)
    store.put(key1, value1)
    store.put(key2, value2)
}