import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const hashPassword = await bcrypt.hash('myPassword', 10);
console.log('Hashed Password:', hashPassword);
const hashPassword2 = await bcrypt.hash('myPassword', 10);
console.log('Hashed Password:', hashPassword2);

console.log(
  'The password is valid:',
  await bcrypt.compare('myPasswor', hashPassword),
);
console.log(
  'The password is valid:',
  await bcrypt.compare('myPassword', hashPassword2),
);

const token = jwt.sign({ userId: 1 }, 'mySecretKey', { expiresIn: '10s' });
console.log('Generated Token:', token);
console.log('Verified Token:', jwt.verify(token, 'mySecretKey'));
