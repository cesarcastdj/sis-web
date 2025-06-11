import bcrypt from 'bcrypt';


async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(String(password).trim(), saltRounds);
  }
  
  // Comparar contraseña
  async function comparePassword(password, hashed) {
    return await bcrypt.compare(String(password).trim(), hashed);
  }
 
  
  export { hashPassword, comparePassword };