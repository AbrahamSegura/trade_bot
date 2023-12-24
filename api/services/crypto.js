import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto'
import { Buffer } from 'buffer'

const secret = String(process.env.SECRET_ENCRYPT_WORD)

const algorithm = 'aes-256-cbc'
const key = createHash('sha256').update(String(secret)).digest('base64').substring(0, 32)
const inicialIv = randomBytes(16)

export function encrypt({ text = '' }) {
    const cipher = createCipheriv(algorithm, Buffer.from(key), inicialIv);
    const encrypted = cipher.update(text);
    const encryptedData = Buffer.concat([encrypted, cipher.final()])
    return { iv: inicialIv.toString('hex'), encryptedData: encryptedData.toString('hex') };
}

export function decrypt({ iv = "", encryptedData = "" }) {

    const encryptedText = Buffer.from(encryptedData, 'hex');
    const decipher = createDecipheriv(algorithm, Buffer.from(key), Buffer.from(iv, 'hex'));
    const decrypted = decipher.update(encryptedText);
    const dataDecrypted = Buffer.concat([decrypted, decipher.final()]);
    return dataDecrypted.toString();
}
