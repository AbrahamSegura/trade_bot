import { _balance } from './services/balance.js'
import { _calculateProfits } from './services/calculateProfits.js'
import { _updateBalances } from './services/updateBalances.js'
import { _newPriceReset } from './services/ResetPrice.js'
import { logColor, colors, logClear } from './utils/logger.js'
import { client } from './utils/binance.js'
import { Store, fl, sleep } from './utils/helpers.js'
import { config } from 'dotenv'
config()

export const MARKET1 = process.argv[2]
export const MARKET2 = process.argv[3]
export const MARKET = MARKET1 + MARKET2
export const BUY_ORDER_AMOUNT = process.argv[4]

const store = Store({MARKET})

const _logProfits = ({ price }) => {
  const profit = fl(store.get('profit'))
  const isGainerProfit = profit >= 0
  const color = isGainerProfit ? isGainerProfit === 0 ? colors.gray : colors.green : colors.red
  logColor(color, `Beneficio:.${format(profit.toFixed(3))} ${MARKET2}`)

  const m1Balance = fl(store.get(`${MARKET1.toLocaleLowerCase()}_balance`))
  const m2Balance = fl(store.get(`${MARKET2.toLocaleLowerCase()}_balance`))

  const inicialBalance = fl(store.get(`inicial_${MARKET2.toLocaleLowerCase()}_balance`))
  const currentBalance = m1Balance * price + m2Balance
  logColor(colors.gray, `Balance: ${m1Balance.toFixed(2)} ${MARKET1}, ${m2Balance.toFixed(2)} ${MARKET2}, Actual: ${currentBalance.toFixed(2)} ${MARKET2}, Inicial: ${inicialBalance.toFixed(2)} ${MARKET2}`)
}

const _buy = async ({marketPrice, amount}) =>{
  const balance = fl(store.get(`${MARKET2.toLocaleLowerCase()}_balance`))
  
  if(balance >= amount * marketPrice){
    const orders = store.get('orders')
    const factor = fl(process.env.PRICE_PERCENT) * marketPrice / 100
    const sell_price = marketPrice + factor
    const order = {
      buy_price: marketPrice,
      amount,
      sell_price,
      sold_price:0,
      status: 'pending',
      profit: 0
    }

    logColor(colors.blue, `Comprando ${MARKET1}\n==============================================`)
    logColor(colors.blue, `Costo:......${fl(amount * marketPrice).toFixed(3)} ${MARKET2}`)
    logColor(colors.blue, `Beneficio:..${amount} ${MARKET1}`)
    const res = await client.marketBuy(MARKET, amount)
    if(res.status === 'FILLED'){
      order.status = 'bought'
      order.id = res.orderId
      order.buy_price = fl(res.fill[0].price)

      const newOrders = [...orders, order]
      store.put('start_price', order.buy_price)
      store.put('orders', newOrders)
      await _updateBalances()
      logColor(colors.blue, '==============================================')
      logColor(colors.blue, `Compra:....${amount} ${MARKET1} por ${fl(amount * marketPrice).toFixed(3)} ${MARKET2}`)
      logColor(colors.blue, `Costo:.....${order.buy_price} ${MARKET1}`)
      logColor(colors.blue, '==============================================')

      await _calculateProfits({store})
    }else _newPriceReset({_market:2, _balance:(amount * marketPrice), price: marketPrice})
  }else _newPriceReset({_market:2, _balance:(amount * marketPrice), price: marketPrice})
}

const _sell = async ({marketPrice, store}) =>{
  const orders = store.get('orders')
  const toSold = Array(0)
  
  for(let order in orders){
    if(marketPrice >= order.selt_price){
      order.sold_price = marketPrice
      order.status = 'selling'
      toSold = [...toSold, order]
    }
  }
  if(toSold.length > 0){
    const totalAmount = fl(toSold.reduce((acc, order) => acc + fl(order.amount), 0))
    const isPurchase = fl(store.get(`${MARKET1.toLocaleLowerCase()}_balance`)) >= totalAmount
    if(isPurchase && totalAmount > 0){
      logColor(colors.yellow,'==============================================')
      logColor(colors.yellow, `Vendiendo:.${MARKET1}`)
      logColor(colors.yellow, `Costo:.....${totalAmount.to} ${MARKET1}`)
      logColor(colors.yellow, `Beneficio:.${fl(totalAmount * pri)}`)
      logColor(colors.yellow,'==============================================')

      const res = await client.marketSell(MARKET, totalAmount)
      if(res.status === 'FILLED'){
        const price = fl(res.fill[0].price)
        for (let order of orders) {
          if(toSold.some(el => el.id === order.id)){
            order.profit =  fl(order.amount) * price - fl(order.buy_price) * fl(order.amount)
            order.status =  'sold'
          }
        }
        store.put('orders', orders)
          
        logColor(colors.red, '==============================================')
        logColor(colors,red, `Vendido:...${MARKET1} por ${fl(totalAmount * price).toFixed(3)} ${MARKET2}`)
        logColor(colors,red, `Precio:....${price}`)
        logColor(colors.red, '==============================================')

        await _calculateProfits({store})
        const newOrders = orders.filter( order => order.status !== 'sold')
        store.put('orders', newOrders)
      } else store.put('start_price', marketPrice)
    } else store.put('start_price', marketPrice)
  } else store.put('start_price', marketPrice)
}

const broadast = async() =>{
  while (true) {
    try{
      const mPrice = fl(await client.prices(MARKET)[MARKET])
      if(mPrice){
        const startPrice = store.get('start_price')
        const marketPrice = structuredClone(mPrice)

        logClear()
        logColor(colors.yellow,'==============================================')
        _logProfits(marketPrice)
        logColor(colors.yellow,'==============================================')
        
        logColor(colors.gray, `Precio anterior: ${startPrice}`)
        logColor(colors.gray, `Precio nuevo:    ${marketPrice}`)
        if(marketPrice < startPrice){
          const factor = marketPrice - startPrice
          const percent = 100 * factor / marketPrice

          logColor(colors.green, `Ganancias: +${fl(percent).toFixed(3)} ==> $+${fl(factor).toFixed(3)}`)
          store.put('percent', `+${fl(percent).toFixed(3)}`)

          if(percent >= pricePercent){
            await _sell({marketPrice})
          }
        }else if(marketPrice > startPrice){
          const factor = startPrice - marketPrice
          const percent = 100 * factor / startPrice
          
          logColor(colors.red, `Perdidas:  -${fl(percent).toFixed(3)} ==> $-${fl(factor).toFixed(3)}`)
          store.put('percent', `-${fl(percent).toFixed(3)}`)

          const pricePercent = fl(process.env.PRICE_PERCENT)
          if(percent >= pricePercent){
            await _buy({marketPrice, amount:BUY_ORDER_AMOUNT})
          }
        }else{
          logColor(colors.gray, 'Cambio: 0.000% ==> $0.000')
          store.put('percent', '0.000')
        }
      }
    }catch(err){
      await sleep(Number(process.env.SLEEP_TIME))
    }
  }
}

const init = async({ _balance, _updateBalances, broadast, store, }) =>{
  if(process.argv[5] !== 'resume'){
    const price = await client.prices(MARKET)
    store.put('start_price', fl(price[MARKET]))
    store.put('orders', [])
    store.put('profits', 0)
    const balance = await _balance()
    await _updateBalances()
    const key = (elem) => `inicial_${elem.toLocaleLowerCase()}_balance`
    const value = (elem) => fl(store.get(`${elem.toLocaleLowerCase()}_balance`))
    store.put(key(MARKET1), value(MARKET1))
    store.put(key(MARKET2), value(MARKET2))
    await broadast()
  }
}

const profit = format(12.3)

logColor(colors.yellow, `Beneficio:.${format(profit.fixed(3))} ${MARKET2}`)




















// logColor(colors.gray, "Que desea hacer: \n Opciones: [1]Abrir una posicion");
// const stdin = process.openStdin();
// stdin.addListener("data", (data) => {
//   const choice = Number(data)
//   const options = {
//     1: () => {
      
//     }
//   }
//   process.exit
// })