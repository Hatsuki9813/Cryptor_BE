import express, { json, response } from 'express'
import mysql from 'mysql'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import moment from 'moment'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import multer from 'multer';
import NodeRSA from 'node-rsa'
import bodyParser from 'body-parser'
import { playfairEncrypt, createPlayfairMatrix, playfairDecrypt,  isPrime,
  generateRandomPrime,
  gcd,
  modInverse,
  padNumber, modPow } from './algorithm.js'
import * as crypto from 'crypto'
// Khởi tạo app Express
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.post("/api/generateMatrix", (req, res) => {
  const { key } = req.body;

  if (!key || typeof key !== "string") {
    return res.status(400).json({ error: "Invalid key" });
  }

  const matrix = createPlayfairMatrix(key);
  console.log(json({ matrix }));
  return res.json({ matrix });
  
});

app.post("/api/encrypt", (req, res) => {
    const { key, text } = req.body;
  
    if (!key || !text) {
      return res.status(400).json({ error: "Key và text là bắt buộc." });
    }
  
    try {
      const matrix = createPlayfairMatrix(key);
      const encryptedText = playfairEncrypt(matrix, text);
  
      return res.json({ encryptedText });
    } catch (error) {
      return res.status(500).json({ error: "Đã xảy ra lỗi khi mã hóa." });
    }
  });
  app.post("/api/decrypt", (req, res) => {
    const { key, text } = req.body;
  
    if (!key || !text) {
      return res.status(400).json({ error: "Key và text là bắt buộc." });
    }
  
    try {
      const matrix = createPlayfairMatrix(key);
      const decryptedText = playfairDecrypt(matrix, text);
  
      return res.json({ decryptedText });
    } catch (error) {
      return res.status(500).json({ error: "Đã xảy ra lỗi khi giải mã." });
    }
  });
  let rsaKeyPair = {}; 
  /*app.post('/rsagenerate-key', (req, res) => {
    const { keySize = 2048 } = req.body;
  
    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: keySize,
        publicKeyEncoding: {
          type: 'pkcs1',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs1',
          format: 'pem',
        },
      });
  
      rsaKeyPair = { publicKey, privateKey };
  
      return res.json({ message: 'Keys generated successfully', publicKey, privateKey });
    } catch (error) {
      return res.status(500).json({ message: 'Error generating keys', error: error.message });
    }
  });*/
  app.post('/rsagenerate-key', (req, res) => {
    const { keySize } = req.body;
    try {
      // Create a new RSA instance and generate keys
      const key = new NodeRSA({ b: keySize || 512 });
      key.setOptions({ encryptionScheme: 'pkcs1_oaep' }); // Tạo khóa với kích thước x sử dụng padding: OAEP padding
  
      const publicKey = key.exportKey('public'); 
      const privateKey = key.exportKey('private'); 
  
      res.json({ publicKey, privateKey });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate RSA keys', details: error.message });
    }
  });
  
  
  // Mã hóa dữ liệu
  /*app.post('/rsaencrypt', (req, res) => {
    const { data, publickey } = req.body;
    if (!publickey) {
      return res.status(400).json({ error: 'Public key is required for encryption' });
    }
    try {
      // Replace \\n with actual newlines if the key is passed in JSON
      const formattedKey = publickey.replace(/\\n/g, '\n');
  
      const encryptedData = crypto.publicEncrypt(
        {
          key: formattedKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(data)
      );
  
      res.json({ encryptedData: encryptedData.toString('base64') });
    } catch (error) {
      res.status(500).json({ message: 'Error encrypting data', error: error.message });
    }
  });*/
  app.post('/rsaencrypt', (req, res) => {
    const { data, publickey } = req.body;
    if (!data || !publickey) {
      return res.status(400).json({ error: 'Data and public key are required for encryption' });
    }
  
    try {
      const key = new NodeRSA();
      key.importKey(publickey, 'public'); 
      key.setOptions({ encryptionScheme: 'pkcs1_oaep' }); // Use OAEP padding
  
      const encryptedData = key.encrypt(data, 'base64'); // Dữ liệu được mã hóa sẽ có dạng Base64
      res.json({ encryptedData });
    } catch (error) {
      res.status(500).json({ error: 'Error encrypting data', details: error.message });
    }
  });
  
  // Giải mã dữ liệu
  app.post('/rsadecrypt', (req, res) => {
    const { encryptedData, privateKey } = req.body;
    if (!encryptedData || !privateKey) {
      return res.status(400).json({ error: 'Encrypted data and private key are required for decryption' });
    }
  
    try {
      const key = new NodeRSA();
      key.importKey(privateKey, 'private'); // Import private key
      key.setOptions({ encryptionScheme: 'pkcs1_oaep' }); // Use OAEP padding
  
      const decryptedData = key.decrypt(encryptedData, 'utf8'); // Dữ liệu được mã hóa sẽ có dạng UTF8
      res.json({ decryptedData });
    } catch (error) {
      res.status(500).json({ error: 'Error decrypting data', details: error.message });
    }
  });
  
  // API: Lấy khóa công khai
  app.get('/rsapublic-key', (req, res) => {
    if (!rsaKeyPair.publicKey) {
      return res.status(404).json({ message: 'Public key not generated' });
    }
    return res.json({ publicKey: rsaKeyPair.publicKey });
  });
  
  // API: Lấy khóa bí mật
  app.get('/rsaprivate-key', (req, res) => {
    if (!rsaKeyPair.privateKey) {
      return res.status(404).json({ message: 'Private key not generated' });
    }
    return res.json({ privateKey: rsaKeyPair.privateKey });
  });
  //API: RSA Demostration:
  app.get('/rsademogenerate-primes', (req, res) => {
    try {
      const p = generateRandomPrime(100, 500);
      const q = generateRandomPrime(100, 500);
      res.json({ p, q });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post('/rsademoencrypt', (req, res) => {
    try {
      const { p, q,e: customE, text } = req.body;
  
      if (!p || !q || !text) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
  
      if (!isPrime(Number(p)) || !isPrime(Number(q))) {
        return res.status(400).json({ error: 'p and q must be prime numbers' });
      }
  
      const pBig = BigInt(p); // P
      const qBig = BigInt(q); // Q 
      const n = pBig * qBig; // N = p. q 
      const phi = (pBig - 1n) * (qBig - 1n); // Phi(n) = (p-1)(q-1)
      let e = customE ? BigInt(customE) : 65537n; // Chọn giá trị E mặc định hoặc do người dùng chọn 
      if (e >= phi) {
        return res.status(400).json({ error: 'e must be less than φ(n)' });
      }
      if (gcd(e, phi) !== 1n) { // e và phi nguyên tố cùng nhau
        if (userE) {
          return res.status(400).json({ error: 'e must be coprime with φ(n)' });
        }
        e = 65537n;
        while (gcd(e, phi) !== 1n) { // nếu e ko nguyên tố cùng nhau vs phi thì + thêm 2
          e += 2n;
        }
      }
   
      const d = modInverse(e, phi); // Tính toán số d = e^−1 mod φ(n)
      let encrypted = '';
      let encryptedArray = [];
  
      for (let i = 0; i < text.length; i++) {
        const m = BigInt(text.charCodeAt(i));
        let c = 1n;
        let me = m;
        let ee = e;
  
        while (ee > 0n) {
          if (ee % 2n === 1n) {
            c = (c * me) % n; // C = M^e mod n 
          }
          me = (me * me) % n;
          ee = ee / 2n;
        }
        
        encryptedArray.push(c.toString());
        encrypted += padNumber(c, 5) + ' ';
      }
  
      res.json({
        publicKey: { e: e.toString(), n: n.toString() },
        privateKey: { d: d.toString(), n: n.toString() },
        encryptedText: encrypted,
        encryptedArray,
        phi: phi.toString() // Trả về giá trị của φ(n)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  /*app.post('/rsademoencrypt', (req, res) => {
    try {
      const { p, q, e: customE, text } = req.body;
  
      if (!p || !q || !text) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
  
      if (!isPrime(Number(p)) || !isPrime(Number(q))) {
        return res.status(400).json({ error: 'p and q must be prime numbers' });
      }
  
      const pBig = BigInt(p);
      const qBig = BigInt(q);
      const n = pBig * qBig;
      const phi = (pBig - 1n) * (qBig - 1n);
  
      let e = customE ? BigInt(customE) : 65537n; // Sử dụng giá trị e từ người dùng hoặc mặc định
    
      if (gcd(e, phi) !== 1n) {
        console.log("e:" + e)
        console.log("phi:" + phi)
        return res.status(400).json({ error: 'e must be coprime with φ(n)' });
      }
  
      const d = modInverse(e, phi);
      let encrypted = '';
      let encryptedArray = [];
  
      for (let i = 0; i < text.length; i++) {
        const m = BigInt(text.charCodeAt(i));
        const c = modPow(m, e, n); // Dùng modPow để thay thế vòng lặp lũy thừa
        encryptedArray.push(c.toString());
        encrypted += c.toString() + ' ';
      }
        /*for (let i = 0; i < text.length; i++) {
          const m = BigInt(text.charCodeAt(i));
          if (m >= n) {
            return res.status(400).json({
              error: `Character at index ${i} (${text[i]}) cannot be encrypted as it exceeds n (${n}). Use larger values for p and q.`,
            });
          }
          const c = modPow(m, e, n);
          encryptedArray.push(c.toString());
          encrypted += c.toString() + ' ';
        }
        
  
      res.json({
        publicKey: { e: e.toString(), n: n.toString() },
        privateKey: { d: d.toString(), n: n.toString() },
        encryptedText: encrypted.trim(),
        encryptedArray,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });*/
  
  app.post('/rsademodecrypt', (req, res) => {
    try {
      const { d, n, encryptedArray } = req.body;
  
      if (!d || !n || !encryptedArray) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
  
      const dBig = BigInt(d); // D 
      const nBig = BigInt(n); // N 
      let decrypted = '';
  
      for (let i = 0; i < encryptedArray.length; i++) {
        const c = BigInt(encryptedArray[i]);
        let m = 1n;
        let ce = c;
        let de = dBig;
  
        while (de > 0n) {
          if (de % 2n === 1n) {
            m = (m * ce) % nBig; // M = C ^ D mod N 
          }
          ce = (ce * ce) % nBig;
          de = de / 2n;
        }
  
        decrypted += String.fromCharCode(Number(m));
      }
  
      res.json({ decryptedText: decrypted });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  /*app.post('/rsademodecrypt', (req, res) => {
    try {
      const { d, n, encryptedArray } = req.body;
  
      if (!d || !n || !encryptedArray) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
  
      const dBig = BigInt(d);
      const nBig = BigInt(n);
      let decrypted = '';
  
      for (let i = 0; i < encryptedArray.length; i++) {
        const c = BigInt(encryptedArray[i]);
        const m = modPow(c, dBig, nBig); // Dùng modPow để giải mã
        decrypted += String.fromCharCode(Number(m));
      }
       /* for (let i = 0; i < encryptedArray.length; i++) {
          const c = BigInt(encryptedArray[i]);
          if (c >= nBig) {
            return res.status(400).json({
              error: `Encrypted value at index ${i} (${c}) exceeds n (${n}).`,
            });
          }
          const m = modPow(c, dBig, nBig);
          decrypted += String.fromCharCode(Number(m));
        } 
        
  
      res.json({ decryptedText: decrypted });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });*/
  
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
