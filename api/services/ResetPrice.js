import { MARKET1, MARKET2 } from "../index.js"

export const _newPriceReset = ({ _market, _balance, price }) => {
    const market = _market == 1 ? MARKET1 : MARKET2
    const balance = fl(_balance)
    const marketBalance = fl(store.get(`${market.toLowerCase()}_balance`))
    if (marketBalance < balance) {
        store.put('start_price', price)
    }
}
