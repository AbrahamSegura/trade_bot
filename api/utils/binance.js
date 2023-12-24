import Binance from 'node-binance-api'

export const client = new Binance().options({
    APIKEY: process.env.APIKEY,
    APISECRET: process.env.SECRET,
    useServerTime: true
})
