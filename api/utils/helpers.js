import Storage from "node-storage"

export const sleep = time => new Promise(resolve => setTimeout(resolve, time))

export const Store = ({MARKET}) => new Storage(`./api/data/${MARKET}.json`)

export const fl = (elem) => parseFloat(elem)