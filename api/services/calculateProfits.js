export const _calculateProfits = async ({ store }) => {
    const orders = store.get('orders') || []
    const sold = orders.filter(order => order.status === 'sold')
    const totalSoldProfit = sold.reduce((acc, el) => acc + fl(el.profit), 0) || 0
    const actualProfit = fl(store.get('profit')) || 0
    store.put('profit', totalSoldProfit + actualProfit)
}