const cls = {
    red: '\x1b[31m%s\x1b[0m',
    green: '\x1b[32m%s\x1b[0m',
    yellow: '\x1b[33m%s\x1b[0m',
    blue:'\x1b[34m%s\x1b[0m',
    gray: '\x1b[37m%s\x1b[0m'
}

export const colors = {
    red: 'red',
    green: 'green',
    yellow: 'yellow',
    blue: 'blue',
    gray: 'gray',
}

export const logColor = (color, content) => {
    console.log(cls[color], content)
}

export const log = (content) => {
    console.log(content)
}

export const logClear = () => console.clear()