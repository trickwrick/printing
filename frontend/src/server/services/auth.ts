import { LoginHistory, User } from '@/server/models';

export async function signup(name: string, email: string, password: string) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const user = await User.create({ name, email, password });
  return {
    message: 'User created successfully',
    user: { id: user._id, name: user.name, email: user.email },
  };
}

export async function login(
  email: string,
  password: string,
  ip?: string,
  userAgent?: string,
) {
  const user = await User.findOne({ email });

  if (!user || user.password !== password) {
    if (user) {
      await LoginHistory.create({
        userId: user._id,
        email: user.email,
        status: 'failed',
        ip,
        userAgent,
      });
    }
    throw new Error('Invalid email or password');
  }

  await LoginHistory.create({
    userId: user._id,
    email: user.email,
    status: 'success',
    ip,
    userAgent,
  });

  return {
    message: 'Login successful',
    user: { id: user._id, name: user.name, email: user.email },
  };
}

export async function getHistory() {
  return LoginHistory.find().sort({ loginTime: -1 }).limit(100);
}
