
export function createPlayfairMatrix(key) {
    const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // Loại bỏ 'J' để vừa 25 ô.
    const matrix = [];
    const seen = new Set();
    let filteredKey = key.toUpperCase().replace(/[^A-Z]/g, "").replace(/J/g, "I");// Chuyển sang in hoa 
   
    filteredKey.split("").forEach(char => { //Thêm các kí tự của khóa vào ma trận 
      if (!seen.has(char)) {
        matrix.push(char);
        seen.add(char);
      }
    });
  
    for (let char of alphabet) { // thêm các kí tự còn lại trong bảng chữ cái vào ma trận 
      if (!seen.has(char)) {
        matrix.push(char);
        seen.add(char);
      }
    }
  
    return Array.from({ length: 5 }, (_, i) => matrix.slice(i * 5, i * 5 + 5));// Array.from() để chuyển danh sách kí tự thành các hàng, mỗi hàng 5 kí tự 
  }
  
  function preprocessInput(text) {
    const processed = text.toUpperCase().replace(/[^A-Z]/g, "").replace(/J/g, "I");
    let result = "";
    for (let i = 0; i < processed.length; i += 2) {
      const a = processed[i];
      const b = processed[i + 1] || "X";  // Nếu số kí tự của bản rõ lẻ thì thêm X vào cuối 
      if (a === b) {
        result += a + "X";  // Nếu có 2 cặp kí tự giống nhau trong văn bản đầu vào thì thêm X vào giữa 
        i--;
      } else {
        result += a + b;
      }
    }
    return result;
  }
  
  function findPosition(matrix, char) { 
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j] === char) return [i, j];
      }
    }
    return null;
  }
  
  export  function playfairEncrypt(matrix, text) {
    const processedText = preprocessInput(text);
    let encrypted = "";
  
    for (let i = 0; i < processedText.length; i += 2) { // Duyệt qua bản rõ  
      const [a, b] = [processedText[i], processedText[i + 1]]; // Xử lì lần lượt Một cặp 2 kí tự của bản rõ  
      const [row1, col1] = findPosition(matrix, a); // Tìm vị trí của từng kí tự trong cặp trong ma trận 
      const [row2, col2] = findPosition(matrix, b);
  
      if (row1 === row2) {
        encrypted += matrix[row1][(col1 + 1) % 5] + matrix[row2][(col2 + 1) % 5]; // Nếu 2 kí tự nằm trên cùng 1 hàng thì bản mã sẽ nằm ở cùng hàng và cột bên cạnh 
      } else if (col1 === col2) {
        encrypted += matrix[(row1 + 1) % 5][col1] + matrix[(row2 + 1) % 5][col2]; // Nếu 2 kí tự cùng cột thì bản mã sẽ nằm cùng cột và thì bản mã sẽ nằm cùng cột và hàng bên cạnh 
      } else {
        encrypted += matrix[row1][col2] + matrix[row2][col1]; //Nếu không cùng hàng hoặc cột, hoán đổi cột

      }
    }
  
    return encrypted;
  }
  
  export function playfairDecrypt(matrix, text) {
    const processedText = preprocessInput(text);
    let decrypted = "";
  
    for (let i = 0; i < processedText.length; i += 2) {
      const [a, b] = [processedText[i], processedText[i + 1]];
      const [row1, col1] = findPosition(matrix, a);
      const [row2, col2] = findPosition(matrix, b);
  
      if (row1 === row2) {
        // Nếu cùng hàng, dịch sang trái
        decrypted += matrix[row1][(col1 + 4) % 5] + matrix[row2][(col2 + 4) % 5];
      } else if (col1 === col2) {
        // Nếu cùng cột, dịch lên trên
        decrypted += matrix[(row1 + 4) % 5][col1] + matrix[(row2 + 4) % 5][col2];
      } else {
        // Nếu không cùng hàng hoặc cột, hoán đổi cột
        decrypted += matrix[row1][col2] + matrix[row2][col1];
      }
    }
  
    return decrypted;
  }
  // RSA Demostration: 
  export const isPrime = (num) => {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    
    for (let i = 5; i * i <= num; i += 6) {
      if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
  }; // Hà 
  
  export const generateRandomPrime = (min, max) => {
    while (true) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (isPrime(num)) return num;
    }
  };
  
  export const gcd = (a, b) => {
    if (b === 0n) return a;
    return gcd(b, a % b);
  };
  
  export const modInverse = (e, phi) => {
    let m0 = phi;
    let y = 0n;
    let x = 1n;
  
    if (phi === 1n) return 0n;
  
    while (e > 1n) {
      let q = e / phi;
      let t = phi;
      phi = e % phi;
      e = t;
      t = y;
      y = x - q * y;
      x = t;
    }
  
    if (x < 0n) x += m0;
    return x;
  };
  
  export const padNumber = (num, length) => {
    return num.toString().padStart(length, '0');
  };
  
  export const modPow = (base, exp, mod) => {
    let result = 1n;
    base = base % mod;
  
    while (exp > 0n) {
      if (exp % 2n === 1n) {
        result = (result * base) % mod;
      }
      exp = exp / 2n;
      base = (base * base) % mod;
    }
  
    return result;
  };