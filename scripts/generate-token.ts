import jwt from 'jsonwebtoken';

const secret = "99e9ec2900cfcddc3723a21e4ea1faa3fe807cdb56f0e096d18b2026b0d761e8eafbd0f72222b080dbe1a3c32e81e459b4202447932394e937936cf2e916e961";
const token = jwt.sign({ id: 'user-123', email: 'test@titan.com' }, secret, { expiresIn: '1y' });
console.log(token);
