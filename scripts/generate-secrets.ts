import { randomBytes } from 'crypto';

interface Secrets {
  jwtSecret: string;
  jwtRefreshSecret: string;
  encryptionKey: string;
}

const generateSecrets = (): Secrets => {
  return {
    jwtSecret: randomBytes(64).toString('hex'),
    jwtRefreshSecret: randomBytes(64).toString('hex'),
    encryptionKey: randomBytes(32).toString('hex'),
  };
};

const displaySecrets = (): void => {
  console.log('🔐 Generating secure secrets for your .env file:\n');
  console.log('='.repeat(80));

  const secrets = generateSecrets();

  console.log('\n# JWT Secrets (copy these to your .env file):');
  console.log(`JWT_SECRET=${secrets.jwtSecret}`);
  console.log(`JWT_REFRESH_SECRET=${secrets.jwtRefreshSecret}`);

  console.log('\n# Encryption Key (AES-256):');
  console.log(`ENCRYPTION_KEY=${secrets.encryptionKey}`);

  console.log('\n' + '='.repeat(80));
  console.log('\n⚠️  IMPORTANT: Keep these secrets safe and NEVER commit them to git!');
  console.log('📝 Copy these values to your .env file\n');
};

displaySecrets();